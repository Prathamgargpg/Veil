// In-game guide. Plain English on purpose: short sentences, common words.
const G={
'Start here':()=>`<h4>What is VEIL?</h4>
<p>VEIL is a bluffing card game. You hide your cards. You can tell the truth or tell a lie. Other players try to catch you lying.</p>
<h4>How to win</h4>
<ul><li>Climb to <b>10 Ascent</b> (points), <b>or</b></li><li>Be the <b>last player</b> who still has a card.</li></ul>
<h4>How a game starts</h4>
<ul><li>Each player gets <b>2 secret cards</b>. They are called <b>Sigils</b>. Only you can see yours.</li>
<li>Everyone starts with 0 Ascent. To keep the game fair, some players start with 1: the 2nd player in a 1 vs 1 game, and the first 2 players in a 4-player game.</li>
<li>Players take turns, one after the other.</li></ul>
<h4>On your turn</h4>
<p>Pick one action. You may say you have a card even when you do not. Other players can <b>challenge</b> you if they think you are lying.</p>
<h4>Time</h4>
<p>You have 25 seconds to choose. If time runs out, the game makes a safe choice for you.</p>
<h4>Ways to play</h4>
<ul><li><b>Initiation:</b> play against computer players (bots). Good for learning.</li>
<li><b>Tutorial:</b> a first game with tips on the screen. You get more time.</li>
<li><b>The Rite:</b> play real people. If nobody joins in 20 seconds, bots join so you can start.</li>
<li><b>Inner Circle:</b> play with friends. Share your room code or invite link.</li></ul>`,
'How to play':()=>`<div class=c>${Object.keys(IC).map(t=>`<span class=hc><big>${ic(t)}</big><b>${t}</b><small>${AB[t]}</small></span>`).join('')}</div>
<h4>Your actions</h4>
<ul><li><b>Tithe:</b> take 1 Ascent. This is always safe. Nobody can challenge it.</li>
<li><b>Broker ⚖:</b> say you have the Broker. If it works, you get 4 Ascent.</li>
<li><b>Blade 🗡:</b> say you have the Blade and pay 2 Ascent. If it works, the player you pick loses a card.</li>
<li><b>Seer 👁:</b> say you have the Seer. If it works, you swap one of your cards for a new one.</li>
<li><b>Warden 🛡:</b> you do not use this on your turn. You say you have it to stop a Blade.</li></ul>
<p><b>Remember:</b> you can say you have any card, even if you do not. That is a <b>bluff</b>.</p>
<h4>When someone challenges</h4>
<p>After you say you have a card, each other player can <b>Let it pass</b> or <b>Challenge</b>.</p>
<ul><li><b>You told the truth:</b> you show the card. The challenger loses a card. Your action still happens. Your card goes back into the deck and you get a new one.</li>
<li><b>You lied:</b> you lose a card. Your action does not happen. If you used a Blade, you do not get your 2 Ascent back.</li></ul>
<h4>When a Blade is aimed at you</h4>
<ul><li><b>Accept:</b> you lose a card.</li><li><b>Block:</b> say you have the Warden. The attacker can then challenge you.<br>If you really have the Warden, the attacker loses a card and the Blade is stopped.<br>If you lied, you lose a card, and the Blade still hits you. You lose a second card.</li></ul>
<h4>Losing a card</h4>
<p>The card turns face up and everyone can see it. It is out of the game. You choose which card to lose. If you lose both cards, you are out of the game.</p>
<h4>Example</h4>
<p>Sam says, "I have the Broker." Lee thinks Sam is lying and challenges. Sam shows a Broker, so Sam told the truth. Lee loses a card. Sam gets 4 Ascent.</p>`,
'Words':()=>`<p>Short meanings of the words you see in the game.</p><dl>
<dt>Accept</dt><dd>Agree to take a Blade hit. You lose a card.</dd>
<dt>Ascent</dt><dd>Your points. Reach 10 to win. Your coloured token climbs the pyramid as your Ascent goes up.</dd>
<dt>Blade</dt><dd>A card and an action. You pay 2 Ascent, and another player loses a card.</dd>
<dt>Block</dt><dd>Try to stop a Blade by saying you have the Warden.</dd>
<dt>Bluff</dt><dd>Saying you have a card when you do not.</dd>
<dt>Bot</dt><dd>A computer player. It has a small ⚙ sign next to its name.</dd>
<dt>Broker</dt><dd>A card and an action. If it works, you get 4 Ascent.</dd>
<dt>Challenge</dt><dd>Saying "I think you are lying." The other player must show the card.</dd>
<dt>Claim</dt><dd>Saying out loud that you have a card, so you can use its power. A claim can be true or a lie.</dd>
<dt>Coach</dt><dd>The tips box you see in the Tutorial.</dd>
<dt>Deck</dt><dd>The pile of cards nobody is holding.</dd>
<dt>Eliminated</dt><dd>Out of the game because you have no cards left.</dd>
<dt>Elo (rating)</dt><dd>A number that shows how strong you are. You start at 1000. Win games against real people to make it go up.</dd>
<dt>Fair start</dt><dd>A small extra point for some players at the start, so the turn order is fair.</dd>
<dt>Hand</dt><dd>The cards you are holding.</dd>
<dt>Invite link</dt><dd>A web link you send to a friend. It takes them straight to your room.</dd>
<dt>Let it pass</dt><dd>Do nothing about a claim. You think it is true, or you do not want to risk it.</dd>
<dt>Practice</dt><dd>A game against bots. It does not change your rating.</dd>
<dt>Private room</dt><dd>A room for friends only. You need the room code to enter.</dd>
<dt>PvP</dt><dd>Player versus Player. You play against real people.</dd>
<dt>Quick match</dt><dd>Find a game fast. If nobody joins in 20 seconds, bots join.</dd>
<dt>Ranked</dt><dd>PvP games between real accounts. They change your rating.</dd>
<dt>Reveal</dt><dd>Turn a card face up to show everyone.</dd>
<dt>Room code</dt><dd>4 letters that let friends join your private room.</dd>
<dt>Season</dt><dd>One month of ranked play. Ratings start again at the beginning of each month. The top 3 players are shown as last season's champions.</dd>
<dt>Seer</dt><dd>A card and an action. If it works, you swap one of your cards for a new one.</dd>
<dt>Sigil</dt><dd>A card. There are 4 kinds: Seer, Blade, Broker and Warden.</dd>
<dt>Swap</dt><dd>Trade a card for a new one from the deck.</dd>
<dt>Tithe</dt><dd>The safe move. You take 1 Ascent and nobody can challenge it.</dd>
<dt>Token</dt><dd>The coloured circle that shows you on the pyramid. It has the first letter of your name.</dd>
<dt>Turn</dt><dd>Your time to act. Players go one after another.</dd>
<dt>Warden</dt><dd>A card you claim to stop a Blade. You never use it on your turn.</dd></dl>`,
'Tips':()=>`<ul><li>At the start, take Tithe or try Broker. Many players will not challenge a small claim.</li>
<li>If a player says they have the same card twice, they may be honest, or they may be very brave. Watch who waits a long time.</li>
<li>Stop the leader. Use a Blade on the player with the most Ascent before they reach 10.</li>
<li>Do not always do the same thing. If you are easy to guess, people will challenge you.</li>
<li>When you have only 1 card left, every challenge can end your game. Only claim what you can risk.</li>
<li>A red screen and a heartbeat sound mean you have 8 seconds left.</li>
<li>Use the emotes to confuse your rivals. 😈</li></ul>`};
// Also load the extra look and feel (public/ui.css and public/ui.js). Remove these lines to go back to the plain style.
(()=>{const l=document.createElement('link');l.rel='stylesheet';l.href='/ui.css';document.head.append(l);const s=document.createElement('script');s.src='/ui.js';document.body.append(s)})();
