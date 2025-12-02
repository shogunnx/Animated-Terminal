import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { TSV_CHARACTERS } from '../content/tsvContent.js';

const STORY_CATEGORIES = {
  test: "Test Stories",
  reddit: "AITA from Reddit",
  youtube: "YouTube Storytimes",
  lore: "TheSaiyanVictoria Lore"
};

const SAMPLE_STORIES = [
  {
    id: 0,
    category: 'test',
    title: 'Test Story - Evil Victoria',
    preview: 'Watch Evil Victoria in action...',
    text: 'This is a pre-recorded video featuring Evil Victoria.',
    duration: '30 sec',
    videoUrl: null,
    preRecordedVideoId: '6f57658f511c42a28c2b53e3ccdda965'
  },
  {
    id: 'test-2',
    category: 'test',
    title: 'Test Video 2',
    preview: 'Another pre-recorded demo...',
    text: 'Pre-recorded test video.',
    duration: '1 min',
    videoUrl: null,
    preRecordedVideoId: 'b9ef2dc39adf44feaa760b60e42cfb37'
  },
  {
    id: 'test-cassidy',
    category: 'test',
    title: 'Cassidy Voice Test',
    preview: 'Evil Victoria with Cassidy voice...',
    text: 'Test the new Cassidy voice for Evil Victoria.',
    duration: '6 sec',
    videoUrl: null,
    preRecordedVideoId: 'e08b1ee999ea4769bf3c738861e962b6'
  },
  {
    id: 'test-groupid',
    category: 'test',
    title: 'Group ID Test',
    preview: 'Evil Victoria using group ID...',
    text: 'Testing group ID for outfit variations.',
    duration: '4 sec',
    videoUrl: null,
    preRecordedVideoId: '5405a3fefa5f4653a26041a190734b6f'
  },
  {
    id: 1,
    category: 'reddit',
    title: 'AITA for refusing to share my inheritance with my sister?',
    preview: 'My grandmother left me everything...',
    text: 'So here\'s the situation. My grandmother passed away six months ago and left everything to me - her house, savings, and jewelry collection. My sister is furious because she expected us to split everything 50/50. But here\'s the thing: I was the one who took care of Grandma for the last five years while my sister was too busy with her life. Am I the asshole for keeping what was legally given to me?',
    duration: '2 min',
    videoUrl: null
  },
  {
    id: 2,
    category: 'reddit',
    title: 'AITA for telling my husband his gaming addiction is ruining our marriage?',
    preview: 'He spends 8 hours a day gaming...',
    text: 'My husband plays video games from the moment he gets home until 2 AM every single day. We have two kids who barely see him. I finally told him that if he doesn\'t change, I\'m leaving. He called me controlling and said gaming is his only hobby. Our marriage is falling apart and I don\'t know what to do anymore.',
    duration: '2 min',
    videoUrl: null
  },
  {
    id: 3,
    category: 'youtube',
    title: 'I Caught My Best Friend Stealing From Me',
    preview: 'I trusted her with everything...',
    text: 'We\'ve been best friends since high school. Last week, I noticed money missing from my wallet. I set up a hidden camera and caught her red-handed taking cash while I was in the bathroom. When I confronted her, she broke down crying and admitted she\'s been stealing from me for months to pay off her credit card debt. I\'m devastated and don\'t know if I can ever trust her again.',
    duration: '3 min',
    videoUrl: null
  },
  {
    id: 4,
    category: 'youtube',
    title: 'My Roommate Is Actually A Millionaire',
    preview: 'Living a double life...',
    text: 'I thought my roommate was just a regular college student struggling to pay rent. One day, a luxury car showed up to pick him up. Turns out, he\'s from an incredibly wealthy family but wanted to experience "normal life" so he pretended to be broke. The weird part? He still asked me to cover his share of groceries last month. I feel so manipulated.',
    duration: '3 min',
    videoUrl: null
  },
  {
    id: 8,
    category: 'reddit',
    title: 'AITA for exposing my brother\'s affair at Thanksgiving dinner?',
    preview: 'Family drama at its finest...',
    text: 'I discovered my brother was cheating on his wife with her sister. I couldn\'t keep it to myself anymore, so during Thanksgiving dinner, I announced it to everyone. The entire family exploded into chaos. My brother hasn\'t spoken to me since, and my parents say I ruined the holiday. But his wife deserved to know the truth. Did I do the right thing?',
    duration: '2 min',
    videoUrl: null
  },
  {
    id: 9,
    category: 'youtube',
    title: 'I Pretended To Be Rich For A Week',
    preview: 'Social experiment gone wrong...',
    text: 'I rented designer clothes and a luxury car for a week to see how differently people would treat me. The results were shocking. The same people who ignored me at coffee shops suddenly wanted to be my friend. Salespeople at high-end stores treated me like royalty. But it all came crashing down when someone recognized the rental car. The embarrassment was unreal.',
    duration: '3 min',
    videoUrl: null
  },
  {
    id: 1000,
    category: 'lore',
    title: 'Chapter 1: A Saiyan's Fate—Captivity, Rebellion, and a New Beginning',
    preview: 'In the depths of a timeline controlled by the tyrannical Black Frieza, the Saiya...',
    text: `In the depths of a timeline controlled by the tyrannical Black Frieza, the Saiyan family was shackled by the oppression of a dark future—a future that none had ever imagined they'd be forced to face. Victoria Chaser, the resolute and stoic protector, had always known that their time in captivity was not their destiny. She trained relentlessly, knowing that only through strength could she break free from Frieza's iron grip.

The Saiyan Time Patrollers—once guardians of the timeline—had been transformed into pawns in a game far darker than they had ever imagined. Victoria Chaser became the driving force of her family's escape plan. Her rebellion wasn't just for herself—it was for her twin sister, Victoria Black, younger sister Wargirl, and for the family they had left behind.

Victoria Black, on the other hand, had no interest in the brutal life of a warrior. Using her enchanting voice and towering, motherly figure, she seduced her way into becoming a Teacher. Her beauty and charm were her weapons, and she wielded them with the same precision as any fighter.

Wargirl, the youngest of the sisters, was the bridge between the two. She found herself at home on the battlefield, driven by her love of battle and the desire to prove herself among the great warriors of the universe.

As Victoria Chaser's rebellion grew, the family made their escape. During their escape, Victoria Black took in a dying Saiyan mother's child, naming her Harmony. Through secret means, Harmony became a permanent spirit fusion of the three sisters—tech-savvy and brimming with potential, a child of hope born from the pain of captivity.

This was only the beginning.`,
    duration: '3 min',
    videoUrl: null
  },
  {
    id: 1001,
    category: 'lore',
    title: 'Chapter 2: A New Fighter Joins the team! Harmony Blaster!',
    preview: 'Harmony Blaster joins the fight, bringing her unique technical skills and fusion...',
    text: `Harmony Blaster joins the fight, bringing her unique technical skills and fusion energy to the team.`,
    duration: '3 min',
    videoUrl: null
  },
  {
    id: 1002,
    category: 'lore',
    title: 'Chapter 3: Victoria Black vs Vegeta: The Deal That Created Binary',
    preview: 'A legendary battle between Victoria Black and Vegeta results in the creation of ...',
    text: `A legendary battle between Victoria Black and Vegeta results in the creation of Binary, a sentient AI entity.`,
    duration: '3 min',
    videoUrl: null
  },
  {
    id: 1003,
    category: 'lore',
    title: 'Chapter 4: Quickly unlock Gohan's Beast Transformation',
    preview: 'Discovering the secrets to unlocking Gohan's powerful Beast transformation....',
    text: `Discovering the secrets to unlocking Gohan's powerful Beast transformation.`,
    duration: '3 min',
    videoUrl: null
  },
  {
    id: 1004,
    category: 'lore',
    title: 'Chapter 5: Vegito vs UI Goku's ShowStealing Entrance',
    preview: 'An epic showdown where Vegito faces Ultra Instinct Goku in a battle for the ages...',
    text: `An epic showdown where Vegito faces Ultra Instinct Goku in a battle for the ages.`,
    duration: '3 min',
    videoUrl: null
  },
  {
    id: 1005,
    category: 'lore',
    title: 'Chapter 6: Blasts in your back, It's Victoria Black',
    preview: 'Victoria Black demonstrates her devastating ki blast techniques in combat....',
    text: `Victoria Black demonstrates her devastating ki blast techniques in combat.`,
    duration: '3 min',
    videoUrl: null
  },
  {
    id: 1006,
    category: 'lore',
    title: 'Chapter 7: Vegeta's Prominence Flash',
    preview: 'A showcase of Vegeta's powerful Prominence Flash technique....',
    text: `A showcase of Vegeta's powerful Prominence Flash technique.`,
    duration: '3 min',
    videoUrl: null
  },
  {
    id: 1007,
    category: 'lore',
    title: 'Chapter 8: Goofing around in the lobby',
    preview: 'Casual moments with the Time Patrollers as they wait for the next mission....',
    text: `Casual moments with the Time Patrollers as they wait for the next mission.`,
    duration: '3 min',
    videoUrl: null
  },
  {
    id: 1008,
    category: 'lore',
    title: 'Chapter 9: How to unlock Vegeta moves!',
    preview: 'Learning the secret techniques behind Raid Blast, Burst Stinger, and Blazing Att...',
    text: `Learning the secret techniques behind Raid Blast, Burst Stinger, and Blazing Attack.`,
    duration: '3 min',
    videoUrl: null
  },
  {
    id: 1009,
    category: 'lore',
    title: 'Chapter 10: The Teacher Goes Mad!',
    preview: 'Victoria Black's alter ego emerges when her teaching job takes a dark turn....',
    text: `Victoria Black's alter ego emerges when her teaching job takes a dark turn.`,
    duration: '3 min',
    videoUrl: null
  },
  {
    id: 1010,
    category: 'lore',
    title: 'Chapter 11: Jerks in the Lobby harassing Victoria Black',
    preview: 'Victoria Black refuses to tolerate disrespect from bullies in Conton City....',
    text: `Victoria Black refuses to tolerate disrespect from bullies in Conton City.`,
    duration: '3 min',
    videoUrl: null
  },
  {
    id: 1011,
    category: 'lore',
    title: 'Chapter 12: Victoria Chaser's Jealousy Leads to Disaster',
    preview: 'Turles exploits the tension between the twin sisters, leading to catastrophic co...',
    text: `Turles exploits the tension between the twin sisters, leading to catastrophic consequences.`,
    duration: '3 min',
    videoUrl: null
  },
  {
    id: 1012,
    category: 'lore',
    title: 'Chapter 13: Binary is Exploited, Birth of Victoria Blue',
    preview: 'Binary's vulnerability leads to her exploitation and the emergence of Victoria B...',
    text: `Binary's vulnerability leads to her exploitation and the emergence of Victoria Blue.`,
    duration: '3 min',
    videoUrl: null
  },
  {
    id: 1013,
    category: 'lore',
    title: 'Chapter 14: Weakened Binary saved from Captain Ginyu',
    preview: 'The fusion of Victoria sisters saves Binary from Captain Ginyu's body-stealing t...',
    text: `The fusion of Victoria sisters saves Binary from Captain Ginyu's body-stealing technique.`,
    duration: '3 min',
    videoUrl: null
  },
  {
    id: 1014,
    category: 'lore',
    title: 'Chapter 15: Jiren gives Victoria her First Mission',
    preview: 'Jiren assigns Victoria her inaugural Pride Trooper mission in a high-stakes show...',
    text: `Jiren assigns Victoria her inaugural Pride Trooper mission in a high-stakes showdown.`,
    duration: '3 min',
    videoUrl: null
  },
  {
    id: 1015,
    category: 'lore',
    title: 'Chapter 16: Can WarGirl beat Fat Buu This time?',
    preview: 'Wargirl faces off against the unpredictable Majin Buu in an intense rematch....',
    text: `Wargirl faces off against the unpredictable Majin Buu in an intense rematch.`,
    duration: '3 min',
    videoUrl: null
  },
  {
    id: 1016,
    category: 'lore',
    title: 'Chapter 17: Birth of Evil Victoria',
    preview: 'When her little sister needs protection, a darker aspect of Victoria is born....',
    text: `When her little sister needs protection, a darker aspect of Victoria is born.`,
    duration: '3 min',
    videoUrl: null
  },
  {
    id: 1017,
    category: 'lore',
    title: 'Chapter 18: Wargirl joins PVP, Death of Turles',
    preview: 'Wargirl enters the PVP arena and finally defeats the persistent villain Turles....',
    text: `Wargirl enters the PVP arena and finally defeats the persistent villain Turles.`,
    duration: '3 min',
    videoUrl: null
  },
  {
    id: 1018,
    category: 'lore',
    title: 'Chapter 19: The night Victoria Black needed Wargirl',
    preview: 'A vulnerable moment reveals the deep bond between Victoria Black and Wargirl....',
    text: `A vulnerable moment reveals the deep bond between Victoria Black and Wargirl.`,
    duration: '3 min',
    videoUrl: null
  },
  {
    id: 1019,
    category: 'lore',
    title: 'Chapter 20: Goku and Gogeta Take DiscoGirl on a Fight Date',
    preview: 'DiscoGirl experiences an unforgettable battle alongside two legendary warriors....',
    text: `DiscoGirl experiences an unforgettable battle alongside two legendary warriors.`,
    duration: '3 min',
    videoUrl: null
  },
  {
    id: 1020,
    category: 'lore',
    title: 'Chapter 21: Captain Ginyu Stopped From Stealing Wargirl's Body',
    preview: 'An unlikely hero prevents Captain Ginyu from stealing Wargirl's powerful Saiyan ...',
    text: `An unlikely hero prevents Captain Ginyu from stealing Wargirl's powerful Saiyan body.`,
    duration: '3 min',
    videoUrl: null
  },
  {
    id: 1021,
    category: 'lore',
    title: 'Chapter 22: Break Time: Harmony gets GROUNDED',
    preview: 'Harmony faces consequences for her actions while watching TV at the Kami House....',
    text: `Harmony faces consequences for her actions while watching TV at the Kami House.`,
    duration: '3 min',
    videoUrl: null
  },
  {
    id: 1022,
    category: 'lore',
    title: 'Chapter 23: Saiyan Females: OP Damage vs Looking Good',
    preview: 'Exploring the balance between devastating power and aesthetic choices for female...',
    text: `Exploring the balance between devastating power and aesthetic choices for female Saiyans.`,
    duration: '3 min',
    videoUrl: null
  },
  {
    id: 1023,
    category: 'lore',
    title: 'Chapter 24: Harmony STILL Grounded! Vegeta vs Zarbon',
    preview: 'While grounded, Harmony watches the epic Vegeta vs Zarbon battle unfold....',
    text: `While grounded, Harmony watches the epic Vegeta vs Zarbon battle unfold.`,
    duration: '3 min',
    videoUrl: null
  },
  {
    id: 1024,
    category: 'lore',
    title: 'Chapter 25: Distracting the Raid Boss',
    preview: 'Strategic teamwork as fighters work together to distract powerful raid bosses....',
    text: `Strategic teamwork as fighters work together to distract powerful raid bosses.`,
    duration: '3 min',
    videoUrl: null
  },
  {
    id: 1025,
    category: 'lore',
    title: 'Chapter 26: How does YOUR CAC look with Ultra Instinct?',
    preview: 'Showcasing custom characters wielding the legendary Ultra Instinct form....',
    text: `Showcasing custom characters wielding the legendary Ultra Instinct form.`,
    duration: '3 min',
    videoUrl: null
  },
  {
    id: 1026,
    category: 'lore',
    title: 'Chapter 27: Epic Fail: Zoning Skills Backfire',
    preview: 'When carefully planned zoning strategies go hilariously wrong in battle....',
    text: `When carefully planned zoning strategies go hilariously wrong in battle.`,
    duration: '3 min',
    videoUrl: null
  },
  {
    id: 1027,
    category: 'lore',
    title: 'Chapter 28: SSJ4 Goku's Hyper Armor made this Raid a NIGHTMARE',
    preview: 'The terrifying power of Super Saiyan 4 Goku's unstoppable momentum....',
    text: `The terrifying power of Super Saiyan 4 Goku's unstoppable momentum.`,
    duration: '3 min',
    videoUrl: null
  },
  {
    id: 1028,
    category: 'lore',
    title: 'Chapter 29: WarGirl injured in Broly Raid - Introduction to Veronica',
    preview: 'A brutal encounter with Broly introduces the mysterious Veronica into the story....',
    text: `A brutal encounter with Broly introduces the mysterious Veronica into the story.`,
    duration: '3 min',
    videoUrl: null
  },
  {
    id: 1029,
    category: 'lore',
    title: 'Chapter 30: Helping Vegeta and Piccolo defeat an unbeatable opponent',
    preview: 'Teamwork is essential when facing seemingly impossible odds....',
    text: `Teamwork is essential when facing seemingly impossible odds.`,
    duration: '3 min',
    videoUrl: null
  },
  {
    id: 1030,
    category: 'lore',
    title: 'Chapter 31: Surpassed but not Forgotten: SSJ3 fun',
    preview: 'Celebrating the classic Super Saiyan 3 transformation despite newer forms....',
    text: `Celebrating the classic Super Saiyan 3 transformation despite newer forms.`,
    duration: '3 min',
    videoUrl: null
  },
  {
    id: 1031,
    category: 'lore',
    title: 'Chapter 32: WarGirl gets Captured!',
    preview: 'A dark turn as Wargirl falls into enemy hands, setting up a desperate rescue mis...',
    text: `A dark turn as Wargirl falls into enemy hands, setting up a desperate rescue mission.`,
    duration: '3 min',
    videoUrl: null
  },
  {
    id: 1032,
    category: 'lore',
    title: 'Chapter 33: Victoria Black Attempts to save WarGirl',
    preview: 'Victoria Black embarks on a solo mission to rescue her beloved Wargirl....',
    text: `Victoria Black embarks on a solo mission to rescue her beloved Wargirl.`,
    duration: '3 min',
    videoUrl: null
  },
  {
    id: 1033,
    category: 'lore',
    title: 'Chapter 34: The Game: Win while Alvarotryhard JUMPS you',
    preview: 'Surviving against overwhelming odds when facing multiple opponents at once....',
    text: `Surviving against overwhelming odds when facing multiple opponents at once.`,
    duration: '3 min',
    videoUrl: null
  },
  {
    id: 1034,
    category: 'lore',
    title: 'Chapter 35: I'll keep Cracker occupied',
    preview: 'Strategic combat roles emerge as the team coordinates their assault....',
    text: `Strategic combat roles emerge as the team coordinates their assault.`,
    duration: '3 min',
    videoUrl: null
  },
  {
    id: 1035,
    category: 'lore',
    title: 'Chapter 36: Fighting your RIVALS makes you stronger',
    preview: 'Intense rivalry battles with @McSweatyThighs push fighters to new heights....',
    text: `Intense rivalry battles with @McSweatyThighs push fighters to new heights.`,
    duration: '3 min',
    videoUrl: null
  },
  {
    id: 1036,
    category: 'lore',
    title: 'Chapter 37: Modders Tricks and Crazy Hits - WARZONE',
    preview: 'Chaos ensues when facing modders with reality-bending abilities....',
    text: `Chaos ensues when facing modders with reality-bending abilities.`,
    duration: '3 min',
    videoUrl: null
  },
  {
    id: 1037,
    category: 'lore',
    title: 'Chapter 38: Surviving a Close Call in My First 2v2s',
    preview: 'A harrowing near-death experience during inaugural 2v2 battles with @×SSJRaven×....',
    text: `A harrowing near-death experience during inaugural 2v2 battles with @×SSJRaven×.`,
    duration: '3 min',
    videoUrl: null
  },
  {
    id: 1038,
    category: 'lore',
    title: 'Chapter 39: Vanessa gets HUMBLED by a god! Introduction to FlashDancer',
    preview: 'Pride comes before the fall as Vanessa meets her match against divine power....',
    text: `Pride comes before the fall as Vanessa meets her match against divine power.`,
    duration: '3 min',
    videoUrl: null
  },
  {
    id: 1039,
    category: 'lore',
    title: 'Chapter 40: Babysitting female Saiyans is Ridiculous',
    preview: 'The chaotic challenges of keeping powerful Saiyan women in check....',
    text: `The chaotic challenges of keeping powerful Saiyan women in check.`,
    duration: '3 min',
    videoUrl: null
  },
  {
    id: 1040,
    category: 'lore',
    title: 'Chapter 41: Birth of Aeria Destroyer',
    preview: 'The most destructive character yet enters the warzone to wreak havoc....',
    text: `The most destructive character yet enters the warzone to wreak havoc.`,
    duration: '3 min',
    videoUrl: null
  },
  {
    id: 1041,
    category: 'lore',
    title: 'Chapter 42: Vanessa looking for new Sword Ultimates',
    preview: 'The quest for the most devastating sword techniques in Xenoverse 2....',
    text: `The quest for the most devastating sword techniques in Xenoverse 2.`,
    duration: '3 min',
    videoUrl: null
  },
  {
    id: 1042,
    category: 'lore',
    title: 'Chapter 43: Vanessa makes a Broly harasser rage quit',
    preview: 'Justice is served when Vanessa defends Victoria Black from a persistent bully....',
    text: `Justice is served when Vanessa defends Victoria Black from a persistent bully.`,
    duration: '3 min',
    videoUrl: null
  },
  {
    id: 1043,
    category: 'lore',
    title: 'Chapter 44: Kid Buu and FlashDancer help you relax',
    preview: 'Finding moments of peace and humor amidst the chaos of battle....',
    text: `Finding moments of peace and humor amidst the chaos of battle.`,
    duration: '3 min',
    videoUrl: null
  },
  {
    id: 1044,
    category: 'lore',
    title: 'Chapter 45: New Hire Modder needs to Jump with Hit',
    preview: 'Another modder enters the fray, teaming up with the legendary assassin Hit....',
    text: `Another modder enters the fray, teaming up with the legendary assassin Hit.`,
    duration: '3 min',
    videoUrl: null
  },
  {
    id: 1045,
    category: 'lore',
    title: 'Chapter 46: Aeria Destroyer stolen For an hour',
    preview: 'A devastating loss when Aeria Destroyer falls victim to Captain Ginyu's body swa...',
    text: `A devastating loss when Aeria Destroyer falls victim to Captain Ginyu's body swap.`,
    duration: '3 min',
    videoUrl: null
  },
  {
    id: 1046,
    category: 'lore',
    title: 'Chapter 47: Goku Black couldn't protect Succubus from MODDERS',
    preview: 'Even divine power isn't enough against reality-warping modders....',
    text: `Even divine power isn't enough against reality-warping modders.`,
    duration: '3 min',
    videoUrl: null
  },
  {
    id: 1047,
    category: 'lore',
    title: 'Chapter 48: A Nightmare for my Female Saiyans Pt1',
    preview: 'The beginning of the darkest arc for the female Saiyan warriors....',
    text: `The beginning of the darkest arc for the female Saiyan warriors.`,
    duration: '3 min',
    videoUrl: null
  },
  {
    id: 1048,
    category: 'lore',
    title: 'Chapter 49: Walmart Broly regretted IMMEDIATELY',
    preview: 'A humorous encounter with a suspiciously weak version of the legendary warrior....',
    text: `A humorous encounter with a suspiciously weak version of the legendary warrior.`,
    duration: '3 min',
    videoUrl: null
  },
  {
    id: 1049,
    category: 'lore',
    title: 'Chapter 50: Broly almost ruins Binary's day as a mortal',
    preview: 'Binary's attempt at living a normal life is threatened by Broly's rampage....',
    text: `Binary's attempt at living a normal life is threatened by Broly's rampage.`,
    duration: '3 min',
    videoUrl: null
  },
  {
    id: 1050,
    category: 'lore',
    title: 'Chapter 51: Victoria's Desperation, Separation from Binary',
    preview: 'A heartbreaking moment as Victoria and Binary are forcibly separated....',
    text: `A heartbreaking moment as Victoria and Binary are forcibly separated.`,
    duration: '3 min',
    videoUrl: null
  },
  {
    id: 1051,
    category: 'lore',
    title: 'Chapter 52: DreamGirl's DreamWorld MiniBoss Battle',
    preview: 'AquarianGod must defeat DreamGirl to progress to higher levels of reality....',
    text: `AquarianGod must defeat DreamGirl to progress to higher levels of reality.`,
    duration: '3 min',
    videoUrl: null
  },
  {
    id: 1052,
    category: 'lore',
    title: 'Chapter 53: Finding a New Power Source',
    preview: 'Adapting to changes after glitched Supersouls are finally patched....',
    text: `Adapting to changes after glitched Supersouls are finally patched.`,
    duration: '3 min',
    videoUrl: null
  },
  {
    id: 1053,
    category: 'lore',
    title: 'Chapter 54: Thanks! This ones a Keeper!',
    preview: 'Discovering a perfect technique or ability worth keeping permanently....',
    text: `Discovering a perfect technique or ability worth keeping permanently.`,
    duration: '3 min',
    videoUrl: null
  },
  {
    id: 1054,
    category: 'lore',
    title: 'Chapter 55: New Goddess Of Destruction challenges Gohan',
    preview: 'A newly ascended Goddess faces her first major challenge against Beast Gohan....',
    text: `A newly ascended Goddess faces her first major challenge against Beast Gohan.`,
    duration: '3 min',
    videoUrl: null
  },
  {
    id: 1055,
    category: 'lore',
    title: 'Chapter 56: Commercial Break - Perfect Timing',
    preview: 'A humorous interlude with impeccable comedic timing....',
    text: `A humorous interlude with impeccable comedic timing.`,
    duration: '3 min',
    videoUrl: null
  },
  {
    id: 1056,
    category: 'lore',
    title: 'Chapter 57: Fight Date! But He Doesn't even know!',
    preview: 'An oblivious warrior becomes the unwitting participant in a romantic battle....',
    text: `An oblivious warrior becomes the unwitting participant in a romantic battle.`,
    duration: '3 min',
    videoUrl: null
  },
  {
    id: 1057,
    category: 'lore',
    title: 'Chapter 58: Never let your mains DIE! WarGirl is RESCUED',
    preview: 'The triumphant rescue mission that saves the beloved Wargirl....',
    text: `The triumphant rescue mission that saves the beloved Wargirl.`,
    duration: '3 min',
    videoUrl: null
  },
  {
    id: 1058,
    category: 'lore',
    title: 'Chapter 59: I'm a Goddess of Destruction, I will NOT Stay in the car!',
    preview: 'A goddess asserts her dominance and refuses to be sidelined....',
    text: `A goddess asserts her dominance and refuses to be sidelined.`,
    duration: '3 min',
    videoUrl: null
  },
  {
    id: 1059,
    category: 'lore',
    title: 'Chapter 60: Goku, Gohan, Vegeta and SKOT Cheer up a Queen',
    preview: 'The mightiest warriors attempt to lift spirits through what they do best—fightin...',
    text: `The mightiest warriors attempt to lift spirits through what they do best—fighting!`,
    duration: '3 min',
    videoUrl: null
  },
  {
    id: 1060,
    category: 'lore',
    title: 'Chapter 61: SuperEvil Victoria OVERCOMES AGGRESSIVE challenger',
    preview: 'A stream battle showcasing SuperEvil Victoria's superior combat skills....',
    text: `A stream battle showcasing SuperEvil Victoria's superior combat skills.`,
    duration: '3 min',
    videoUrl: null
  },
  {
    id: 1061,
    category: 'lore',
    title: 'Chapter 62: Attributes messed up but Broly wants REVENGE NOW',
    preview: 'Fighting with handicapped stats while facing an enraged Broly....',
    text: `Fighting with handicapped stats while facing an enraged Broly.`,
    duration: '3 min',
    videoUrl: null
  },
  {
    id: 1062,
    category: 'lore',
    title: 'Chapter 63: Cpt.Masami Crosses Victoria',
    preview: 'An original character challenges Victoria on her journey to become the best....',
    text: `An original character challenges Victoria on her journey to become the best.`,
    duration: '3 min',
    videoUrl: null
  },
  {
    id: 1063,
    category: 'lore',
    title: 'Chapter 64: Beast Girl protects her goofy BF',
    preview: 'Love and loyalty drive Beast Girl to defend her boyfriend from a bigger opponent...',
    text: `Love and loyalty drive Beast Girl to defend her boyfriend from a bigger opponent.`,
    duration: '3 min',
    videoUrl: null
  },
  {
    id: 1064,
    category: 'lore',
    title: 'Chapter 65: Fighting an Evil Super Saiyan 3 (Modded)',
    preview: 'Facing an impossibly powerful modded character in mortal combat....',
    text: `Facing an impossibly powerful modded character in mortal combat.`,
    duration: '3 min',
    videoUrl: null
  },
  {
    id: 1065,
    category: 'lore',
    title: 'Chapter 66: She Fought Majin Buu Alone—Wargirl Could Only Watch',
    preview: 'A heartbreaking battle where Wargirl is forced to stand helpless on the sideline...',
    text: `A heartbreaking battle where Wargirl is forced to stand helpless on the sidelines.`,
    duration: '3 min',
    videoUrl: null
  },
  {
    id: 1066,
    category: 'lore',
    title: 'Chapter 67: Victoria Black Captured by Troll level Fans',
    preview: 'Even a goddess can fall victim to coordinated trolling tactics....',
    text: `Even a goddess can fall victim to coordinated trolling tactics.`,
    duration: '3 min',
    videoUrl: null
  },
  {
    id: 1067,
    category: 'lore',
    title: 'Chapter 68: Attacked By Shaggy',
    preview: 'The meme becomes reality when the ultra-powerful Shaggy enters the battlefield....',
    text: `The meme becomes reality when the ultra-powerful Shaggy enters the battlefield.`,
    duration: '3 min',
    videoUrl: null
  },
  {
    id: 1068,
    category: 'lore',
    title: 'Chapter 69: Wargirl's Aftermath: Victoria's Secret Grief',
    preview: 'The emotional fallout following Wargirl's traumatic experience....',
    text: `The emotional fallout following Wargirl's traumatic experience.`,
    duration: '3 min',
    videoUrl: null
  },
  {
    id: 1069,
    category: 'lore',
    title: 'Chapter 70: Is THIS the fastest Supersoul? 30% Faster',
    preview: 'Testing the limits of speed with powerful Supersoul combinations....',
    text: `Testing the limits of speed with powerful Supersoul combinations.`,
    duration: '3 min',
    videoUrl: null
  },
  {
    id: 1070,
    category: 'lore',
    title: 'Chapter 71: She Kissed Turles in Public—Then Saved the Day',
    preview: 'A shocking public display followed by heroic action against SavageJay....',
    text: `A shocking public display followed by heroic action against SavageJay.`,
    duration: '3 min',
    videoUrl: null
  },
  {
    id: 1071,
    category: 'lore',
    title: 'Chapter 72: Evil Victoria Is Lying to Goku',
    preview: 'Deception and manipulation as Evil Victoria plays a dangerous game with Goku....',
    text: `Deception and manipulation as Evil Victoria plays a dangerous game with Goku.`,
    duration: '3 min',
    videoUrl: null
  },
  {
    id: 1072,
    category: 'lore',
    title: 'Chapter 73: What If Cell Had a Successor?',
    preview: 'Exploring the terrifying possibility of Cell's legacy continuing with Cellegsus....',
    text: `Exploring the terrifying possibility of Cell's legacy continuing with Cellegsus.`,
    duration: '3 min',
    videoUrl: null
  },
  {
    id: 1073,
    category: 'lore',
    title: 'Chapter 74: UNBEATABLE Female SSJ3! Max Power Build',
    preview: 'The ultimate Super Saiyan 3 female build showcasing devastating power....',
    text: `The ultimate Super Saiyan 3 female build showcasing devastating power.`,
    duration: '3 min',
    videoUrl: null
  },
  {
    id: 1074,
    category: 'lore',
    title: 'Chapter 75: Merged Zamasu vs Super Villain Broly',
    preview: 'Even a god prefers delegation when facing the legendary Super Villain Broly....',
    text: `Even a god prefers delegation when facing the legendary Super Villain Broly.`,
    duration: '3 min',
    videoUrl: null
  },
  {
    id: 1075,
    category: 'lore',
    title: 'Chapter 76: Binary blackmails Vanessa',
    preview: 'Dark manipulation as Binary forces Vanessa into unwanted combat....',
    text: `Dark manipulation as Binary forces Vanessa into unwanted combat.`,
    duration: '3 min',
    videoUrl: null
  },
  {
    id: 1076,
    category: 'lore',
    title: 'Chapter 77: Saiyan's Debt: A Lover's Unseen Prison',
    preview: 'The tragic story of Wargirl's emotional and physical captivity to Victoria Black...',
    text: `The tragic story of Wargirl's emotional and physical captivity to Victoria Black. After Victoria Black saved Wargirl from the Gas Mask Clan and Binary destroyed an entire planet in revenge, Wargirl surrendered completely to Victoria—emotionally, psychologically, and physically. She works at the Conton City Club, but everyone knows she belongs to Victoria. Every night ends the same way: Victoria's possessive touch, her whispered commands, and Wargirl's absolute obedience. Meanwhile, Veronica searches desperately for the woman she rescued years ago, unaware that Wargirl is now bound by gratitude, trauma, and an all-consuming relationship with Victoria Black.`,
    duration: '3 min',
    videoUrl: null
  },
  {
    id: 1077,
    category: 'lore',
    title: 'Chapter 78: 'Immortality Doesn't Save You!' Female Majin's Win',
    preview: 'An epic three-round battle where a Female Majin defeats immortal opponents throu...',
    text: `An epic three-round battle where a Female Majin defeats immortal opponents through pure skill and willpower.`,
    duration: '3 min',
    videoUrl: null
  },
  {
    id: 1078,
    category: 'lore',
    title: 'Chapter 79: Jiren ONLY wants to fight Goku! Speed vs Power',
    preview: 'When a challenger requests Jiren, Victoria Black proves that Jiren's secretary i...',
    text: `When a challenger requests Jiren, Victoria Black proves that Jiren's secretary is just as capable.`,
    duration: '3 min',
    videoUrl: null
  },
  {
    id: 1079,
    category: 'lore',
    title: 'Chapter 80: Ever dreamed of sharing your epic characters?',
    preview: 'Introduction to the Wiki and invitation for OC creators to join the universe....',
    text: `Introduction to the Wiki and invitation for OC creators to join the universe.`,
    duration: '3 min',
    videoUrl: null
  },
  {
    id: 1080,
    category: 'lore',
    title: 'Chapter 81: Beast Gohan Intervenes to be a Hero... But....',
    preview: 'Gohan's heroic intervention leads to unexpected consequences against Evil Victor...',
    text: `Gohan's heroic intervention leads to unexpected consequences against Evil Victoria.`,
    duration: '3 min',
    videoUrl: null
  },
  {
    id: 1081,
    category: 'lore',
    title: 'Chapter 82: Victoria Black Doesn't Want SSJ3 Wargirl to Leave',
    preview: 'An intimate moment between Victoria Black and Wargirl before work....',
    text: `An intimate moment between Victoria Black and Wargirl before work.`,
    duration: '3 min',
    videoUrl: null
  },
  {
    id: 1082,
    category: 'lore',
    title: 'Chapter 83: The Seduction of Kefla (Evil Victoria #2)',
    preview: 'Evil Victoria's passionate encounter with Kefla leads to an awkward morning surp...',
    text: `Evil Victoria's passionate encounter with Kefla leads to an awkward morning surprise when the fusion wears off.`,
    duration: '3 min',
    videoUrl: null
  },
  {
    id: 1083,
    category: 'lore',
    title: 'Chapter 84: The Fight on the Rooftop',
    preview: 'Evil Victoria and Shy Kefla face Harmony, Binary, and Goddess Vanessa in an inte...',
    text: `Evil Victoria and Shy Kefla face Harmony, Binary, and Goddess Vanessa in an intense rooftop battle. The fight escalates when Binary unleashes a planet-threatening explosion to eliminate Kefla, forcing Evil Victoria to abandon her fight and dive into the blast to save her lover using her Shadow Barrier and calling upon Zamasu's divine power for restoration.`,
    duration: '3 min',
    videoUrl: null
  },
  {
    id: 1084,
    category: 'lore',
    title: 'Chapter 85: Veronica reunites with Wargirl—Birth of Cellegsus!',
    preview: 'After years of searching, Veronica finally tracks Wargirl to the Conton City Clu...',
    text: `After years of searching, Veronica finally tracks Wargirl to the Conton City Club. But their reunion is complicated by Victoria Black's possessive relationship with Wargirl. Meanwhile, at the destroyed Red Ribbon facility, Victoria Black's blood mixes with a bioengineered embryo, creating the terrifying new entity: Cellegsus.`,
    duration: '3 min',
    videoUrl: null
  },
];

const HEYGEN_AVATARS = {
  'evil_victoria': { id: '130c202a4e7a47898dfc6f434c86dc24', name: 'Evil Victoria', portrait: null, isPreRecorded: false, isGroupId: true },
  'evil_victoria_alt': { id: '98cc7d80048842ffa8e75196f98391e2', name: 'Evil Victoria (Alt)', portrait: 'https://customer-assets.emergentagent.com/job_char-chat-world/artifacts/jvbc12fl_evilviccourt.png', isPreRecorded: true },
  'wargirl': { id: 'c8680d9549744019809f0acc04faac65', name: 'Wargirl', portrait: null, isPreRecorded: false },
  'victoria_black': { id: '84516b469b1f44dbb126c40aa24b2df0', name: 'Victoria Black', portrait: null, isPreRecorded: false }
};

export default function StoryTime() {
  const nav = useNavigate();
  const videoRef = useRef(null);
  
  const [selectedNarrator, setSelectedNarrator] = useState('evil_victoria');
  const [currentStory, setCurrentStory] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState('reddit');
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState(null);

  const handleNarratorChange = (narratorId) => {
    setSelectedNarrator(narratorId);
    // Reset current story when changing narrator
    if (currentStory) {
      setCurrentStory(null);
      setGeneratedVideoUrl(null);
      setIsPlaying(false);
    }
  };

  const handleStorySelect = async (story) => {
    setCurrentStory(story);
    setIsPlaying(false);
    setGeneratedVideoUrl(null);
    
    // Check if story has a pre-recorded video ID
    if (story.preRecordedVideoId) {
      setIsLoading(true);
      try {
        // Fetch the pre-recorded video status directly
        const statusResponse = await fetch(`/api/storytime/status/${story.preRecordedVideoId}`);
        const statusData = await statusResponse.json();
        
        const videoUrl = statusData.data?.video_url;
        
        if (videoUrl) {
          setGeneratedVideoUrl(videoUrl);
        } else {
          throw new Error('Pre-recorded video not found');
        }
      } catch (error) {
        console.error('Error loading pre-recorded video:', error);
        alert(`Failed to load pre-recorded video: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
      return;
    }
    
    // Generate video using HeyGen API
    setIsLoading(true);
    try {
      // Get the current narrator
      const currentNarratorData = HEYGEN_AVATARS[selectedNarrator];
      
      // If narrator is pre-recorded only, use the regular evil_victoria avatar for generation
      const avatarIdForGeneration = currentNarratorData.isPreRecorded 
        ? HEYGEN_AVATARS['evil_victoria'].id 
        : currentNarratorData.id;
      
      const response = await fetch('/api/storytime/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          avatar_id: avatarIdForGeneration,
          story_text: story.text,
          story_title: story.title
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to generate video');
      }
      
      const videoId = data.video_id;
      
      if (videoId) {
        // Poll for video status
        const pollStatus = async () => {
          const maxAttempts = 60; // Poll for up to 5 minutes (60 * 5 seconds)
          let attempts = 0;
          
          const checkStatus = async () => {
            try {
              const statusResponse = await fetch(`/api/storytime/status/${videoId}`);
              const statusData = await statusResponse.json();
              
              const videoStatus = statusData.data?.status;
              const videoUrl = statusData.data?.video_url;
              
              if (videoStatus === 'completed' && videoUrl) {
                setGeneratedVideoUrl(videoUrl);
                setIsLoading(false);
                return true;
              } else if (videoStatus === 'failed') {
                throw new Error('Video generation failed');
              } else if (attempts >= maxAttempts) {
                throw new Error('Video generation timeout');
              }
              
              attempts++;
              return false;
            } catch (error) {
              console.error('Error checking video status:', error);
              throw error;
            }
          };
          
          // Start polling
          while (attempts < maxAttempts) {
            const completed = await checkStatus();
            if (completed) break;
            await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds between checks
          }
        };
        
        await pollStatus();
      }
    } catch (error) {
      console.error('Error generating story video:', error);
      alert(`Failed to generate story video: ${error.message}`);
      setIsLoading(false);
    }
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleRandomStory = () => {
    const randomStory = SAMPLE_STORIES[Math.floor(Math.random() * SAMPLE_STORIES.length)];
    handleStorySelect(randomStory);
  };

  const currentNarrator = HEYGEN_AVATARS[selectedNarrator];
  // Fallback to evil_victoria for alt narrator
  const characterLookupId = selectedNarrator === 'evil_victoria_alt' ? 'evil_victoria' : selectedNarrator;
  const characterData = TSV_CHARACTERS.find(c => c.id === characterLookupId);

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      {/* Header */}
      <div className="tsv-glass tsv-glow tsv-scanlines" style={{ padding: 16, marginBottom: 14 }}>
        <div className="tsv-title" style={{ fontSize: 14 }}>📖 STORYTIME CHAMBER</div>
        <div style={{ marginTop: 10, fontSize: 13, opacity: 0.78 }}>
          <span style={{ color: '#ff69b4' }}>SYSTEM:</span> Select your narrator and choose a story to begin.
        </div>
      </div>

      {/* Narrator Selection */}
      <div className="tsv-glass" style={{ padding: 14, marginBottom: 14 }}>
        <div className="tsv-title" style={{ fontSize: 12, marginBottom: 12 }}>SELECT YOUR NARRATOR</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {Object.entries(HEYGEN_AVATARS).map(([id, avatar]) => {
            const char = TSV_CHARACTERS.find(c => c.id === id);
            const isSelected = selectedNarrator === id;
            return (
              <button
                key={id}
                onClick={() => handleNarratorChange(id)}
                className="tsv-glass"
                style={{
                  padding: 0,
                  cursor: 'pointer',
                  border: isSelected ? `2px solid ${char?.accent || '#ff69b4'}` : '2px solid rgba(255,255,255,.14)',
                  borderRadius: 12,
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  transform: isSelected ? 'translateY(-4px)' : 'translateY(0)',
                  boxShadow: isSelected ? `0 8px 24px ${char?.accent || '#ff69b4'}40` : 'none'
                }}
              >
                <div style={{ aspectRatio: '1', position: 'relative' }}>
                  <img 
                    src={avatar.portrait || char?.portrait} 
                    alt={avatar.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: 8,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 'bold', color: char?.accent }}>
                      {avatar.name}
                    </div>
                  </div>
                  {isSelected && (
                    <div style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      background: char?.accent,
                      color: '#000',
                      padding: '4px 8px',
                      borderRadius: 4,
                      fontSize: 10,
                      fontWeight: 'bold'
                    }}>
                      SELECTED
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Story Room - Romantic Bedroom Background */}
      <div 
        className="tsv-scanlines"
        style={{
          marginBottom: 14,
          borderRadius: 16,
          position: 'relative',
          minHeight: 600,
          overflow: 'hidden',
          border: '2px solid rgba(255,105,180,0.3)',
          boxShadow: '0 8px 32px rgba(255,105,180,0.2)'
        }}
      >
        {/* Background Image */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'url(https://customer-assets.emergentagent.com/job_char-chat-world/artifacts/0otpcd04_bedroomstorytime.jpeg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          zIndex: 0
        }}>
          {/* Overlay for better text readability */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.3) 100%)',
            zIndex: 1
          }} />
        </div>

        {/* Animated Elements Overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          zIndex: 2,
          pointerEvents: 'none'
        }}>
          {/* Floating sparkles/particles */}
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                width: '4px',
                height: '4px',
                background: 'rgba(255,182,193,0.6)',
                borderRadius: '50%',
                top: `${15 + (i * 7)}%`,
                left: `${10 + (i * 8)}%`,
                animation: `float ${3 + (i % 3)}s ease-in-out infinite`,
                animationDelay: `${i * 0.3}s`,
                boxShadow: '0 0 10px rgba(255,182,193,0.8)'
              }}
            />
          ))}

          {/* Pulsing ambient light overlays */}
          <div style={{
            position: 'absolute',
            top: '10%',
            left: '20%',
            width: '200px',
            height: '200px',
            background: 'radial-gradient(circle, rgba(255,105,180,0.15), transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(40px)',
            animation: 'pulse 4s ease-in-out infinite'
          }} />
          
          <div style={{
            position: 'absolute',
            bottom: '15%',
            right: '25%',
            width: '180px',
            height: '180px',
            background: 'radial-gradient(circle, rgba(138,43,226,0.12), transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(50px)',
            animation: 'pulse 5s ease-in-out infinite 1s'
          }} />

          {/* Rose petals floating */}
          {[...Array(6)].map((_, i) => (
            <div
              key={`petal-${i}`}
              style={{
                position: 'absolute',
                width: '8px',
                height: '12px',
                background: 'rgba(255,160,180,0.4)',
                borderRadius: '50% 0 50% 0',
                top: `${20 + (i * 15)}%`,
                left: `${85 + (i % 2) * 5}%`,
                animation: `fallingSoft ${4 + (i % 2)}s ease-in-out infinite`,
                animationDelay: `${i * 0.8}s`,
                transform: 'rotate(45deg)'
              }}
            />
          ))}
        </div>

        {/* Video Player / Talking Head - Foreground */}
        <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', padding: '40px 20px', minHeight: 500 }}>
          {isLoading ? (
            <div style={{ 
              padding: 60, 
              textAlign: 'center',
              background: 'rgba(0,0,0,0.7)',
              borderRadius: 16,
              backdropFilter: 'blur(10px)',
              maxWidth: 600,
              margin: '80px auto'
            }}>
              <div className="tsv-title" style={{ fontSize: 14, marginBottom: 12 }}>⚡ GENERATING STORY VIDEO...</div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>HeyGen AI is creating your personalized story experience</div>
            </div>
          ) : generatedVideoUrl ? (
            <div style={{ maxWidth: 600, margin: '60px auto' }}>
              <video
                ref={videoRef}
                src={generatedVideoUrl}
                style={{ 
                  width: '100%', 
                  borderRadius: 16, 
                  border: `3px solid ${characterData?.accent}`,
                  boxShadow: `0 10px 40px ${characterData?.accent}60, 0 0 60px ${characterData?.accent}40`
                }}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
              />
              {currentStory && (
                <div style={{ 
                  marginTop: 12, 
                  padding: 12, 
                  background: 'rgba(0,0,0,0.8)', 
                  borderRadius: 8,
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${characterData?.accent}40`
                }}>
                  <div className="tsv-title" style={{ fontSize: 13, color: characterData?.accent }}>
                    {currentStory.title}
                  </div>
                  <div style={{ fontSize: 10, opacity: 0.7, marginTop: 4 }}>
                    {currentStory.category.toUpperCase()} • {currentStory.duration}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ 
              padding: 80,
              background: 'rgba(0,0,0,0.6)',
              borderRadius: 16,
              backdropFilter: 'blur(10px)',
              maxWidth: 600,
              margin: '80px auto',
              border: '2px solid rgba(255,105,180,0.3)'
            }}>
              <div style={{ fontSize: 60, marginBottom: 16 }}>🎭</div>
              <div className="tsv-title" style={{ fontSize: 14, marginBottom: 8, color: characterData?.accent }}>
                {currentNarrator.name}&apos;s Story Chamber
              </div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>
                Select a story from the list below to begin
              </div>
            </div>
          )}

          {/* Playback Controls */}
          {generatedVideoUrl && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 20 }}>
              <button 
                className="tsv-btn"
                onClick={handlePlayPause}
                style={{ 
                  fontSize: 12, 
                  padding: '10px 24px',
                  background: `linear-gradient(135deg, ${characterData?.accent}40, ${characterData?.glow}20)`,
                  border: `2px solid ${characterData?.accent}`,
                  boxShadow: `0 4px 12px ${characterData?.accent}30`
                }}
              >
                {isPlaying ? '⏸️ PAUSE' : '▶️ PLAY'}
              </button>
              <button 
                className="tsv-btn"
                onClick={handleRandomStory}
                style={{ fontSize: 12, padding: '10px 24px' }}
              >
                🎲 RANDOM STORY
              </button>
            </div>
          )}
        </div>

        {/* CSS Animations */}
        <style>{`
          @keyframes float {
            0%, 100% { 
              transform: translateY(0px) translateX(0px);
              opacity: 0.3;
            }
            50% { 
              transform: translateY(-20px) translateX(10px);
              opacity: 0.8;
            }
          }
          
          @keyframes pulse {
            0%, 100% { 
              opacity: 0.4;
              transform: scale(1);
            }
            50% { 
              opacity: 0.7;
              transform: scale(1.1);
            }
          }
          
          @keyframes fallingSoft {
            0% {
              transform: translateY(0) rotate(0deg);
              opacity: 0;
            }
            10% {
              opacity: 0.6;
            }
            90% {
              opacity: 0.6;
            }
            100% {
              transform: translateY(400px) rotate(180deg);
              opacity: 0;
            }
          }
        `}</style>
      </div>

      {/* Story List */}
      <div className="tsv-glass" style={{ padding: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div className="tsv-title" style={{ fontSize: 12 }}>📚 STORY LIBRARY</div>
          <button 
            className="tsv-btn"
            onClick={() => nav('/')}
            style={{ fontSize: 11, padding: '6px 12px' }}
          >
            🚪 EXIT CHAMBER
          </button>
        </div>

        {/* Category Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {Object.entries(STORY_CATEGORIES).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setExpandedCategory(expandedCategory === key ? null : key)}
              className="tsv-btn"
              style={{
                fontSize: 11,
                padding: '6px 12px',
                background: expandedCategory === key ? 'rgba(255,105,180,0.3)' : 'rgba(255,255,255,0.08)',
                borderColor: expandedCategory === key ? '#ff69b4' : 'rgba(255,255,255,0.14)'
              }}
            >
              {label} ({SAMPLE_STORIES.filter(s => s.category === key).length})
            </button>
          ))}
        </div>

        {/* Story Items */}
        <AnimatePresence>
          {expandedCategory && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{ display: 'grid', gap: 8 }}>
                {SAMPLE_STORIES
                  .filter(s => s.category === expandedCategory)
                  .map((story) => (
                    <button
                      key={story.id}
                      onClick={() => handleStorySelect(story)}
                      className="tsv-glass"
                      style={{
                        padding: 12,
                        textAlign: 'left',
                        cursor: 'pointer',
                        border: currentStory?.id === story.id ? '2px solid #ff69b4' : '1px solid rgba(255,255,255,0.14)',
                        borderRadius: 8,
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, fontWeight: 'bold', color: '#ff69b4', marginBottom: 4 }}>
                            {story.title}
                          </div>
                          <div style={{ fontSize: 10, opacity: 0.7 }}>
                            {story.preview}
                          </div>
                        </div>
                        <div style={{
                          fontSize: 10,
                          padding: '4px 8px',
                          background: 'rgba(255,105,180,0.2)',
                          borderRadius: 4,
                          marginLeft: 12
                        }}>
                          {story.duration}
                        </div>
                      </div>
                    </button>
                  ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
