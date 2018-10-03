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
    const voter = getCurrentParticipant() // by ACL rules only Voter participant have access to this transaction processor function
    if(voter.voted) throw new Error('Already voted');

    const factory = getFactory()

    const candidate = factory.newRelationship(namespace, 'Candidate', vote_request.candidate_id);
    candidate.votes += 1;
    voter.voted = true; // Voter needs to have its casted vote updated on registry

    // Update candidate votes counting
    const candidateRegistry = await getParticipantRegistry(candidate.getFullyQualifiedType());
    await candidateRegistry.update(candidate);

    const voterParticipantRegistry = await getParticipantRegistry(vote.voter.getFullyQualifiedType())
    await voterParticipantRegistry.update(vote.voter)
}

 /**
 * A function that allows an election to be created
 * @param {ufal.voting.network.CreateElection} election_request request details about the election
 * @transaction
 */
async function createElection(election_request) {
    const electionManager = getCurrentParticipant() // by ACL rules only Election Authority participant have access to this transaction processor function

    const factory = getFactory()

    const newElection = factory.newResource(namespace, 'Election', election_request.election_id)
    newElection.title = election_request.title
    newElection.description = election_request.description
    newElection.manager = electionManager

    // Create election asset
    const electionRegistry = await getAssetRegistry(newElection.getFullyQualifiedType())
    await candidateRegistry.add(newElection)

    // Update elections collection on electionManager. [Relationships are unidirectional.]
    electionManager.elections.push(newElection)
    const electionManagerRegistry = await getParticipantRegistry(electionManager.getFullyQualifiedType())
    electionManagerRegistry.update(electionManager)
}

 /**
 * A function that allows a candidate to be added to an existing election
 * @param {ufal.voting.network.AddCandidate} add_candidate request details about the election and candidate info
 * @transaction
 */
async function addCandidate(election_request) {
    const electionManager = getCurrentParticipant() // by ACL rules only Election Authority participant have access to this transaction processor function

    const factory = getFactory()

    const electionRegistry = await getAssetRegistry(namespace, 'Election')
    const election = await electionRegistry.get(election_request.election_id)
    const candidate = factory.newResource(namespace, "Candidate", election_request.candidate_id)
    candidate.name = election_request.candidate_name
    candidate.campaing_message = election_request.candidate_campaing_message
    candidate.election = election

    const candidateRegistry = await getParticipantRegistry(candidate.getFullyQualifiedType())
    candidateRegistry.add(candidate)

    // Update candidates collection on election. [Relationships are unidirectional.]
    election.candidates.push(candidate)
    election.elections.push(newElection)
    electionRegistry.update(election)
}

 /**
 * A function that starts an election
 * @param {ufal.voting.network.StartElection} election_id
 * @transaction
 */
async function startElection(election_id) {
    const factory = getFactory()

    const electionRegistry = await getAssetRegistry(namespace, 'Election')
    election = electionRegistry.get(election_id)
    if(!election) throw new Error('Election does not exist');
    election.status = 'STARTED'
    electionRegistry.update(election)
}