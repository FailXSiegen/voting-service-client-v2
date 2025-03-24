import { ref } from "vue";
import l18n from "@/l18n";
import { usePollStatePersistence } from "@/core/composable/poll-state-persistence";
import { useMutation } from "@vue/apollo-composable";
import { CREATE_POLL_SUBMIT_ANSWER } from "@/modules/eventUser/graphql/mutation/create-poll-submit-answer";

export function useVotingProcess(eventUser, event) {
  const usedVotesCount = ref(0);
  const voteCounter = ref(1);
  const pollStatePersistence = usePollStatePersistence();
  const onVotingCompleted = ref(() => { });
  const currentPollId = ref(null);

  function setVotingCompletedCallback(callback) {
    onVotingCompleted.value = callback;
  }

  function resetVoteCountersForNewPoll(newPollId) {
    if (newPollId !== currentPollId.value) {
      console.log(`SICHERHEIT: Neue Abstimmung erkannt. Zähler werden zurückgesetzt (Poll ID: ${newPollId})`);
      usedVotesCount.value = 0;
      voteCounter.value = 1;
      currentPollId.value = newPollId;
    }
  }

  async function handleFormSubmit(pollFormData, poll, votesToUse = null) {
    const pollId = poll.value?.id ?? 0;

    resetVoteCountersForNewPoll(pollId);

    const maxAllowedVotes = eventUser.value.voteAmount;
    const remainingVotes = maxAllowedVotes - usedVotesCount.value;

    console.log(`SICHERHEIT: Insgesamt ${maxAllowedVotes} Stimmen, davon ${usedVotesCount.value} bereits verwendet. 
                 Verbleibend: ${remainingVotes}`);

    if (remainingVotes <= 0) {
      if (pollId) {
        pollStatePersistence.upsertPollState(pollId, 99999);
      }
      await onVotingCompleted.value();
      return;
    }

    let actualVotesToUse = 1;

    if (pollFormData.useAllAvailableVotes) {
      actualVotesToUse = remainingVotes;
    } else if (votesToUse !== null && votesToUse > 0) {
      const requested = parseInt(votesToUse, 10);
      actualVotesToUse = Math.min(requested, remainingVotes);
    }

    for (let i = 0; i < actualVotesToUse; i++) {
      await submitSingleVote(pollFormData, poll, false);
      usedVotesCount.value++;
      if (usedVotesCount.value >= maxAllowedVotes) {
        break;
      }
    }

    if (usedVotesCount.value >= maxAllowedVotes) {
      if (pollId) {
        pollStatePersistence.upsertPollState(pollId, 99999);
      }
      voteCounter.value = 1;
      await onVotingCompleted.value();
    } else {
      voteCounter.value = usedVotesCount.value + 1;
      pollStatePersistence.upsertPollState(pollId, voteCounter.value);
    }
  }

  async function submitSingleVote(pollFormData, poll, useAllVotes) {
    const baseInput = {
      eventUserId: eventUser.value.id,
      pollId: poll.value?.id ?? 0,
      type: poll.value.type,
      voteCycle: usedVotesCount.value + 1,
      answerItemLength: 1,
      answerItemCount: 1,
      multivote: useAllVotes,
    };

    try {
      if (pollFormData.abstain) {
        const input = {
          ...baseInput,
          answerContent: l18n.global.tc("view.polls.modal.abstain"),
          possibleAnswerId: null,
        };
        await mutateAnswer(input);
      } else if (pollFormData.multipleAnswers?.length > 0) {
        let answerCounter = 1;
        for await (const answerId of pollFormData.multipleAnswers) {
          const answer = poll.value.possibleAnswers.find(
            (x) => parseInt(x.id) === parseInt(answerId),
          );
          const input = {
            ...baseInput,
            answerContent: answer.content,
            possibleAnswerId: answer.id,
            answerItemLength: pollFormData.multipleAnswers.length,
            answerItemCount: answerCounter,
          };
          await mutateAnswer(input);
          answerCounter++;
        }
      } else if (pollFormData.singleAnswer) {
        const answer = poll.value.possibleAnswers.find(
          (x) => parseInt(x.id) === parseInt(pollFormData.singleAnswer),
        );
        const input = {
          ...baseInput,
          answerContent: answer.content,
          possibleAnswerId: answer.id,
        };
        await mutateAnswer(input);
      } else {
        console.warn("Invalid form data. Submit wird ignoriert!");
        return false;
      }

      return true;
    } catch (error) {
      console.error("Fehler bei der Stimmabgabe:", error);
      return false;
    }
  }

  function resetVoteCounts() {
    usedVotesCount.value = 0;
    voteCounter.value = 1;
    currentPollId.value = null;
  }

  return {
    voteCounter,
    handleFormSubmit,
    setVotingCompletedCallback,
    resetVoteCounts
  };
}

async function mutateAnswer(input) {
  try {
    const createPollSubmitAnswerMutation = useMutation(
      CREATE_POLL_SUBMIT_ANSWER,
      {
        variables: { input },
      },
    );
    await createPollSubmitAnswerMutation.mutate();
  } catch (error) {
    console.error("Fehler bei der Mutation:", error);
    throw error;
  }
}