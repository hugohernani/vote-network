/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const namespace = 'ufal.voting.network';

 /**
 * A function that allows a vote to be casted
 * @param {ufal.voting.network.MakeVote} vote_request request details about the voting
 * @transaction
 */
async function makeVote(vote_request) {
    const factory = getFactory()

    const electionRegistry = await getAssetRegistry(namespace + '.Election')
    const election = await electionRegistry.get(vote_request.election_id)

    const candidateRegistry = await getParticipantRegistry(namespace + '.Candidate')
    candidate = await candidateRegistry.get(vote_request.candidate_id)

    secret_voter = null
    const secretVoterRegistry = await getParticipantRegistry(namespace + '.SecretVoter')
    if(await secretVoterRegistry.exists(vote_request.vote_id)){
        secret_voter = await secretVoterRegistry.get(vote_request.voter_id)
    }else{
        secret_voter = factory.newResource(namespace, 'SecretVoter', vote_request.voter_id)
    }

    if((election.allowed_voter_ids.indexOf(vote_request.voter_id) != -1) && secret_voter.voted == false){
        secret_voter.voted = true

        secret_voter.candidate = factory.newRelationship(namespace, 'Candidate', candidate.candidate_id)

        await secretVoterRegistry.add(secret_voter)
    }

    candidate.votes += 1;
    await candidateRegistry.update(candidate)
}

 /**
 * A function that allows an election to be created
 * @param {ufal.voting.network.CreateElection} election_request request details about the election
 * @transaction
 */
async function createElection(election_request) {
    const managerRegistry = await getParticipantRegistry(namespace + '.Manager')
    electionManager = await managerRegistry.get(election_request.manager_id)

    const factory = getFactory()

    const newElection = factory.newResource(namespace, 'Election', election_request.election_id)
    newElection.title = election_request.title
    newElection.start_time = election_request.start_time
    newElection.end_time = election_request.end_time
    newElection.allowed_voter_ids = election_request.allowed_voter_ids
    newElection.manager = factory.newRelationship(namespace, "Manager", electionManager.manager_id)

    // Create election asset
    const electionRegistry = await getAssetRegistry(newElection.getFullyQualifiedType())
    await electionRegistry.add(newElection)
}

 /**
 * A function that allows candidates and voters to be added to an existing election
 * @param {ufal.voting.network.AddElectionMembers} request_details details about the election and candidates/members info
 * @transaction
 */
async function addElectionMembers(request_details) {
    const factory = getFactory()

    const electionRegistry = await getAssetRegistry(namespace + '.Election')
    const election = await electionRegistry.get(request_details.election_id)

    candidates = []
    for(const candidateInfo of request_details.candidates){
        const candidate = factory.newResource(namespace, 'Candidate', candidateInfo.candidate_id)
        candidate.name = candidateInfo.name
        candidate.election = factory.newRelationship(namespace, "Election", election.election_id)
        candidates.push(candidate)
    }

    const candidateRegistry = await getParticipantRegistry(namespace + '.Candidate')
    await candidateRegistry.addAll(candidates)

    voters = []
    for(const voter_email of request_details.voter_emails){
        const voter = factory.newResource(namespace, 'Voter', voter_email)
        voter.election = factory.newRelationship(namespace, "Election", election.election_id)
        voters.push(voter)
    }

    const voterRegistry = await getParticipantRegistry(namespace + '.Voter')
    await voterRegistry.addAll(voters)
}

 /**
 * A function that starts an election
 * @param {ufal.voting.network.StartElection} election_id
 * @transaction
 */
async function startElection(start_election_request) {
    const electionRegistry = await getAssetRegistry(namespace + '.Election')
    const election = await electionRegistry.get(start_election_request.election_id)
    if(!election) throw new Error('Election does not exist');
    election.status = 'STARTED'
    await electionRegistry.update(election)
}

 /**
 * A function that starts an election
 * @param {ufal.voting.network.EndElection} election_id
 * @transaction
 */
async function endElection(end_election_request) {
    const electionRegistry = await getAssetRegistry(namespace + '.Election')
    const election = await electionRegistry.get(end_election_request.election_id)
    election.status = 'FINISHED'
    await electionRegistry.update(election)
}