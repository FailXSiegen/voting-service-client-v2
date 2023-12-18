import { ref } from "vue";
import l18n from "@/l18n";
import { usePollStatePersistence } from "@/core/composable/poll-state-persistence";
import { useMutation } from "@vue/apollo-composable";
import { CREATE_POLL_SUBMIT_ANSWER } from "@/modules/eventUser/graphql/mutation/create-poll-submit-answer";

// todo show better validation info.
export function useVotingProcess(eventUser, event) {
  const voteCounter = ref(1);
  const pollStatePersistence = usePollStatePersistence();
  const onVotingCompleted = ref(() => {});

  function setVotingCompletedCallback(callback) {
    onVotingCompleted.value = callback;
  }

  async function handleFormSubmit(pollFormData, poll) {
    const input = {
      eventUserId: eventUser.value.id,
      pollId: poll.value?.id ?? 0,
      type: poll.value.type,
      voteCycle: voteCounter.value,
      answerItemLength: 1,
      answerItemCount: 1,
      multivote: pollFormData.useAllAvailableVotes,
    };
    if (pollFormData.abstain) {
      // Abstain.
      input.answerContent = l18n.global.tc("view.polls.modal.abstain");
      input.possibleAnswerId = null;
      await mutateAnswer(input);
    } else if (pollFormData.multipleAnswers?.length > 0) {
      // Multiple answers to persist.
      let answerCounter = 1;
      for await (const answerId of pollFormData.multipleAnswers) {
        const answer = poll.value.possibleAnswers.find(
          (x) => parseInt(x.id) === parseInt(answerId),
        );
        input.answerContent = answer.content;
        input.possibleAnswerId = answer.id;
        input.answerItemLength = pollFormData.multipleAnswers.length;
        input.answerItemCount = answerCounter;
        await mutateAnswer(input);
        answerCounter++;
      }
    } else if (pollFormData.singleAnswer) {
      // Single answers to persist.
      const answer = poll.value.possibleAnswers.find(
        (x) => parseInt(x.id) === parseInt(pollFormData.singleAnswer),
      );
      input.answerContent = answer.content;
      input.possibleAnswerId = answer.id;

      await mutateAnswer(input);
    } else {
      // Invalid form data. Just ignore that submit.
      console.warn("invalid form data. Submit gets ignored!");
      return;
    }

    if (
      voteCounter.value >= (eventUser.value?.voteAmount || 1) ||
      pollFormData.useAllAvailableVotes ||
      event.multivoteType === 2
    ) {
      if (poll.value?.id) {
        pollStatePersistence.upsertPollState(poll.value.id, 99999);
      }
      // Poll has been completed.
      voteCounter.value = 1;
      await onVotingCompleted.value();
      return;
    }
    voteCounter.value++;
    // todo handle - pollFormData.useAllAvailableVotes
    pollStatePersistence.upsertPollState(poll.value.id, voteCounter.value);
  }

  return {
    voteCounter,
    handleFormSubmit,
    setVotingCompletedCallback,
  };
}

async function mutateAnswer(input) {
  const createPollSubmitAnswerMutation = useMutation(
    CREATE_POLL_SUBMIT_ANSWER,
    {
      variables: { input },
    },
  );
  await createPollSubmitAnswerMutation.mutate();
}
