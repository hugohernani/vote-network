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
async function castVote(vote_request) {
    voter = getCurrentParticipant() // by ACL rules only Voter participant have access to this transaction processor function
    if(currentParticipant.voted) throw new Error('Already voted');

    const factory = getFactory()

    const candidate = factory.newRelationship(namespace, 'Candidate', vote_request.candidate_id);
    candidate.votes += 1;

    // Update candidate votes counting
    const candidateRegistry = getParticipantRegistry(candidate.getFullyQualifiedType());
    await candidateRegistry.update(candidate);

    // Voter needs to have its casted vote updated on registry
    voter.voted = true;
    const voterParticipantRegistry = factory.getParticipantRegistry(vote.voter.getFullyQualifiedType())
    await voterParticipantRegistry.update(vote.voter)
}