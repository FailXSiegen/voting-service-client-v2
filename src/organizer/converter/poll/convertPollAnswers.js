export function convertPollAnswers (poll) {
  delete poll.possibleAnswers
  poll.possibleAnswers = []
  switch (poll.pollAnswer) {
    case 'yesNoAbstain':
      poll.possibleAnswers = [
        {
          content: 'Ja'
        },
        {
          content: 'Nein'
        },
        {
          content: 'Enthaltung'
        }
      ]
      poll.list = ''
      poll.allowAbstain = false
      poll.maxVotes = 1
      poll.minVotes = 0
      break
    case 'yesNo':
      poll.possibleAnswers = [
        {
          content: 'Ja'
        },
        {
          content: 'Nein'
        }
      ]
      poll.list = ''
      poll.allowAbstain = false
      poll.maxVotes = 1
      poll.minVotes = 0
      break
    case 'custom':
      for (const customAnswer of poll.list.split('\n')) {
        poll.possibleAnswers.push({ content: customAnswer })
      }
      break
  }
  return poll
}
