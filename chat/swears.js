import leoProfanity from 'leo-profanity';

leoProfanity.remove(['crap', 'damn', 'hell', 'suck', 'stupid', 'idiot']);
leoProfanity.add(['yourword1', 'yourword2']); // your custom list

function checkMessage(text) {
  if (leoProfanity.check(text)) {
    return { allowed: false, censored: leoProfanity.clean(text) };
  }
  return { allowed: true, censored: text };
}
