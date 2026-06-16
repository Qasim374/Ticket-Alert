// The heart of the app: fetch live matches, detect when a score went UP
// (= a goal), and push a notification to everyone subscribed.
import { getLiveMatches } from "./scores";
import { getSubscriptions, getLastScores, setLastScores } from "./store";
import { sendPush } from "./push";

export async function checkForGoals() {
  const matches = await getLiveMatches();
  const last = await getLastScores();
  const subs = await getSubscriptions();
  const goals = [];

  for (const m of matches) {
    const prev = last[m.id] || { homeScore: 0, awayScore: 0 };

    if (m.homeScore > prev.homeScore) {
      goals.push({ match: m, scorer: m.home });
    }
    if (m.awayScore > prev.awayScore) {
      goals.push({ match: m, scorer: m.away });
    }

    last[m.id] = { homeScore: m.homeScore, awayScore: m.awayScore };
  }

  await setLastScores(last);

  // Fan out a push for each goal to every subscriber.
  for (const g of goals) {
    const { match, scorer } = g;
    const payload = {
      title: `⚽ GOAL! ${scorer} scores`,
      body: `${match.home} ${match.homeScore} - ${match.awayScore} ${match.away}`,
    };
    await Promise.all(subs.map((s) => sendPush(s, payload)));
  }

  return { matches, goals: goals.length, subscribers: subs.length };
}
