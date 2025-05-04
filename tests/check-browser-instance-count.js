// Funktion zum Überprüfen der Browser-Instanz-Zählung über die Konsole
// Kann in der Browser-Konsole ausgeführt werden, während ein Organisator eingeloggt ist

async function checkBrowserInstanceCounts() {
  console.log("Checking browser instance counts for the latest poll...");

  try {
    // 1. Die neueste Abstimmung finden
    const pollsResponse = await fetch('/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `
          query LatestPoll {
            polls {
              id
              title
              createdAt
              maxVotes
            }
          }
        `
      })
    });

    const pollsData = await pollsResponse.json();
    
    if (pollsData.errors) {
      console.error("GraphQL Error:", pollsData.errors);
      return;
    }
    
    const polls = pollsData.data.polls;
    const latestPoll = polls.sort((a, b) => b.id - a.id)[0];
    
    if (!latestPoll) {
      console.error("No polls found!");
      return;
    }
    
    console.log(`Latest poll: ID ${latestPoll.id}, Title: "${latestPoll.title}", Max votes: ${latestPoll.maxVotes}`);

    // 2. PubSub-Daten und UI-Werte protokollieren
    console.log("Current UI values:");
    
    // Elemente finden und ihre Inhalte ausgeben
    const voteCounterElements = document.querySelectorAll('.vote-counter, .poll-stats, .poll-progress, .progress-info');
    
    if (voteCounterElements.length > 0) {
      voteCounterElements.forEach((el, i) => {
        console.log(`Vote counter element ${i+1}: "${el.textContent.trim()}"`);
      });
    } else {
      console.log("No vote counter elements found in the UI");
    }

    // 3. PollResult-Daten abrufen
    const pollResultResponse = await fetch('/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `
          query PollResult($pollId: Int!) {
            pollResult(pollId: $pollId) {
              id
              pollId
              maxVotes
              pollAnswersCount
              pollUserCount
              pollUserVotedCount
              pollPossibleAnswers {
                id
                text
                voteCount
              }
            }
          }
        `,
        variables: {
          pollId: parseInt(latestPoll.id)
        }
      })
    });

    const resultData = await pollResultResponse.json();
    
    if (resultData.errors) {
      console.error("GraphQL Error getting poll result:", resultData.errors);
      return;
    }
    
    const pollResult = resultData.data.pollResult;
    
    console.log("----- POLL RESULT DATA -----");
    console.log(`Poll ID: ${pollResult.pollId}`);
    console.log(`Max votes: ${pollResult.maxVotes}`);
    console.log(`Answers count: ${pollResult.pollAnswersCount}`);
    console.log(`User count: ${pollResult.pollUserCount}`);
    console.log(`Voted user count: ${pollResult.pollUserVotedCount}`);
    console.log("Answer distribution:");
    
    pollResult.pollPossibleAnswers.forEach(answer => {
      console.log(`  "${answer.text}": ${answer.voteCount} votes`);
    });

    console.log("----- END POLL RESULT DATA -----");

    // 4. Prüfe active-poll-event-user Daten
    const activePollResponse = await fetch('/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `
          query ActivePollEventUser {
            activePollEventUser {
              poll {
                id
                title
                maxVotes
              }
              pollUsersVoted
              pollUsersCount
              pollAnswersCount
              maxPollVotes
            }
          }
        `
      })
    });

    const activePollData = await activePollResponse.json();
    
    if (activePollData.errors) {
      console.error("GraphQL Error getting active poll:", activePollData.errors);
      return;
    }
    
    const activePoll = activePollData.data.activePollEventUser;
    
    if (activePoll) {
      console.log("----- ACTIVE POLL DATA -----");
      console.log(`Poll ID: ${activePoll.poll.id}`);
      console.log(`Title: "${activePoll.poll.title}"`);
      console.log(`Max votes: ${activePoll.poll.maxVotes}`);
      console.log(`Users voted: ${activePoll.pollUsersVoted}`);
      console.log(`Total users: ${activePoll.pollUsersCount}`);
      console.log(`Answers count: ${activePoll.pollAnswersCount}`);
      console.log(`Max poll votes: ${activePoll.maxPollVotes}`);
      console.log("----- END ACTIVE POLL DATA -----");
    } else {
      console.log("No active poll found");
    }

    console.log("Browser instance check complete!");
  } catch (error) {
    console.error("Error checking browser instances:", error);
  }
}

// Funktion ausführen
checkBrowserInstanceCounts();