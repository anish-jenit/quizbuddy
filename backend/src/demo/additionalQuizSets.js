const makeQuiz = ({ title, description, category, difficulty = 'medium', timePerQuestion = 30, entries }) => {
  const answers = entries.map((entry) => entry[1]);
  return {
    title,
    description,
    category,
    difficulty,
    timePerQuestion,
    questions: entries.map(([questionText, answer, explanation], index) => {
      const distractors = [];
      for (let offset = 1; distractors.length < 3; offset += 1) {
        const candidate = answers[(index + offset) % answers.length];
        if (candidate !== answer && !distractors.includes(candidate)) distractors.push(candidate);
      }
      const correctIndex = index % 4;
      const optionTexts = [...distractors];
      optionTexts.splice(correctIndex, 0, answer);
      return {
        questionText,
        options: optionTexts.map((text, optionIndex) => ({ text, isCorrect: optionIndex === correctIndex })),
        correctAnswer: answer,
        explanation: explanation || `The correct answer is ${answer}.`,
        difficulty
      };
    })
  };
};

const quiz = (title, description, category, entries, difficulty = 'medium', timePerQuestion = 30) =>
  makeQuiz({ title, description, category, entries, difficulty, timePerQuestion });

export const additionalQuizSets = [
  quiz('Tamil Numbers and Colours', 'Tamil words for common numbers and colours', 'Tamil', [
    ['Which Tamil word means one?', 'Ondru'], ['Which Tamil word means two?', 'Irandu'],
    ['Which Tamil word means three?', 'Moondru'], ['Which Tamil word means four?', 'Naangu'],
    ['Which Tamil word means five?', 'Aindhu'], ['Which Tamil word means red?', 'Sivappu'],
    ['Which Tamil word means blue?', 'Neelam'], ['Which Tamil word means green?', 'Pachai'],
    ['Which Tamil word means white?', 'Vellai'], ['Which Tamil word means black?', 'Karuppu']
  ], 'easy'),
  quiz('Tamil Everyday Vocabulary', 'Useful Tamil words from daily life', 'Tamil', [
    ['What is the Tamil word for house?', 'Veedu'], ['What is the Tamil word for book?', 'Puthagam'],
    ['What is the Tamil word for school?', 'Palli'], ['What is the Tamil word for food?', 'Unavu'],
    ['What is the Tamil word for milk?', 'Paal'], ['What is the Tamil word for tree?', 'Maram'],
    ['What is the Tamil word for sun?', 'Sooriyan'], ['What is the Tamil word for moon?', 'Nila'],
    ['What is the Tamil word for friend?', 'Nanban'], ['What is the Tamil word for child?', 'Kuzhandhai']
  ], 'easy'),
  quiz('Tamil Arts and Culture', 'Traditions and cultural heritage of Tamil communities', 'Tamil', [
    ['Which classical Tamil dance form originated in Tamil Nadu?', 'Bharatanatyam'],
    ['Which stringed instrument appears in ancient Tamil literature?', 'Yazh'],
    ['What decorative floor art is drawn at Tamil homes?', 'Kolam'],
    ['Which epic tells the story of Kannagi?', 'Silappathikaram'],
    ['Who wrote the Thirukkural?', 'Thiruvalluvar'],
    ['Which city is famous for the Meenakshi Temple?', 'Madurai'],
    ['What harvest dish is also the name of a Tamil festival?', 'Pongal'],
    ['Which Tamil month begins the traditional new year?', 'Chithirai'],
    ['What is the traditional Tamil martial art called?', 'Silambam'],
    ['Which ancient Tamil port is linked with the Chola period?', 'Poompuhar']
  ]),
  quiz('Tamil Script and Sounds', 'Recognise foundational Tamil letters and sounds', 'Tamil', [
    ['Which Tamil letter represents the sound a?', 'அ'], ['Which Tamil letter represents the sound aa?', 'ஆ'],
    ['Which Tamil letter represents the sound i?', 'இ'], ['Which Tamil letter represents the sound ii?', 'ஈ'],
    ['Which Tamil letter represents the sound u?', 'உ'], ['Which Tamil letter represents the sound uu?', 'ஊ'],
    ['Which Tamil letter begins the word kai?', 'க'], ['Which Tamil letter begins the word sangam?', 'ச'],
    ['Which Tamil letter begins the word Tamil?', 'த'], ['Which special Tamil letter is pronounced zha?', 'ழ']
  ], 'medium', 40),

  quiz('English Synonyms', 'Choose words with similar meanings', 'English', [
    ['Which word is a synonym for happy?', 'Joyful'], ['Which word is a synonym for begin?', 'Start'],
    ['Which word is a synonym for silent?', 'Quiet'], ['Which word is a synonym for clever?', 'Smart'],
    ['Which word is a synonym for large?', 'Huge'], ['Which word is a synonym for tiny?', 'Minute'],
    ['Which word is a synonym for honest?', 'Truthful'], ['Which word is a synonym for angry?', 'Furious'],
    ['Which word is a synonym for simple?', 'Easy'], ['Which word is a synonym for select?', 'Choose']
  ], 'easy'),
  quiz('English Antonyms', 'Choose words with opposite meanings', 'English', [
    ['Which word is the opposite of narrow?', 'Wide'], ['Which word is the opposite of victory?', 'Defeat'],
    ['Which word is the opposite of generous?', 'Selfish'], ['Which word is the opposite of arrive?', 'Depart'],
    ['Which word is the opposite of include?', 'Exclude'], ['Which word is the opposite of shallow?', 'Deep'],
    ['Which word is the opposite of permanent?', 'Temporary'], ['Which word is the opposite of accept?', 'Reject'],
    ['Which word is the opposite of ancient?', 'Modern'], ['Which word is the opposite of noisy?', 'Silent']
  ], 'easy'),
  quiz('English Grammar Builder', 'Parts of speech and sentence structure', 'English', [
    ['What part of speech is quickly?', 'Adverb'], ['What part of speech is beautiful?', 'Adjective'],
    ['What part of speech is teacher?', 'Noun'], ['What part of speech is jump?', 'Verb'],
    ['Which term names a word replacing a noun?', 'Pronoun'], ['Which term names a joining word such as and?', 'Conjunction'],
    ['Which term names words such as in and under?', 'Preposition'], ['What is the subject in Birds fly?', 'Birds'],
    ['What is the predicate in Cats sleep?', 'Sleep'], ['Which tense describes an action happening now?', 'Present continuous']
  ]),
  quiz('English Idioms and Expressions', 'Meanings of familiar English expressions', 'English', [
    ['What does break the ice mean?', 'Start a friendly conversation'],
    ['What does piece of cake mean?', 'Something very easy'],
    ['What does hit the books mean?', 'Study seriously'],
    ['What does under the weather mean?', 'Feeling unwell'],
    ['What does once in a blue moon mean?', 'Very rarely'],
    ['What does spill the beans mean?', 'Reveal a secret'],
    ['What does cost an arm and a leg mean?', 'Be very expensive'],
    ['What does on cloud nine mean?', 'Feel extremely happy'],
    ['What does call it a day mean?', 'Stop working for now'],
    ['What does the ball is in your court mean?', 'It is your decision']
  ], 'medium', 40),

  quiz('Math Addition and Subtraction', 'Mental arithmetic with whole numbers', 'Math', [
    ['What is 28 + 17?', '45'], ['What is 63 - 29?', '34'], ['What is 46 + 38?', '84'],
    ['What is 100 - 47?', '53'], ['What is 125 + 75?', '200'], ['What is 91 - 36?', '55'],
    ['What is 57 + 64?', '121'], ['What is 150 - 85?', '65'], ['What is 208 + 92?', '300'],
    ['What is 500 - 275?', '225']
  ], 'easy'),
  quiz('Math Multiplication and Division', 'Practice products and quotients', 'Math', [
    ['What is 7 × 8?', '56'], ['What is 96 ÷ 12?', '8'], ['What is 9 × 9?', '81'],
    ['What is 144 ÷ 12?', '12'], ['What is 15 × 6?', '90'], ['What is 132 ÷ 11?', '12'],
    ['What is 14 × 7?', '98'], ['What is 225 ÷ 15?', '15'], ['What is 16 × 8?', '128'],
    ['What is 360 ÷ 9?', '40']
  ], 'easy'),
  quiz('Math Fractions and Percentages', 'Equivalent fractions and percentage reasoning', 'Math', [
    ['What is 1/2 of 80?', '40'], ['What is 25% of 200?', '50'], ['Which decimal equals 3/4?', '0.75'],
    ['What is 10% of 350?', '35'], ['Which fraction equals 0.2?', '1/5'], ['What is 2/3 of 60?', '40'],
    ['What percentage is 1/4?', '25%'], ['What is 75% of 40?', '30'], ['Which fraction simplifies from 6/8?', '3/4'],
    ['What is 5% of 500?', '25']
  ]),
  quiz('Math Geometry and Measurement', 'Shapes angles area and measurement', 'Math', [
    ['How many sides does a hexagon have?', '6'], ['How many degrees form a straight angle?', '180'],
    ['What is the area of a 5 by 4 rectangle?', '20'], ['What is the perimeter of a 6 by 3 rectangle?', '18'],
    ['What do we call a triangle with three equal sides?', 'Equilateral'], ['How many faces does a cube have?', '6 faces'],
    ['Which unit commonly measures liquid volume?', 'Litre'], ['How many centimetres are in one metre?', '100'],
    ['What is the diameter of a circle with radius 7?', '14'], ['Which shape has no straight sides?', 'Circle']
  ]),

  quiz('Science Space Explorer', 'Planets stars and space exploration', 'Science', [
    ['Which planet is closest to the Sun?', 'Mercury'], ['Which planet is largest?', 'Jupiter'],
    ['Which planet has prominent rings?', 'Saturn'], ['What galaxy contains our solar system?', 'Milky Way'],
    ['What is Earth’s natural satellite?', 'Moon'], ['Which planet is famous for a Great Red Spot?', 'Jupiter'],
    ['What instrument observes distant objects in space?', 'Telescope'], ['What force keeps planets in orbit?', 'Gravity'],
    ['Which planet rotates on its side?', 'Uranus'], ['What is a shooting star actually called?', 'Meteor']
  ]),
  quiz('Science Human Body', 'Organs systems and healthy bodies', 'Science', [
    ['Which organ controls the nervous system?', 'Brain'], ['Which organs exchange oxygen and carbon dioxide?', 'Lungs'],
    ['Which organ filters blood to make urine?', 'Kidney'], ['What is the largest organ of the human body?', 'Skin'],
    ['Which blood cells carry oxygen?', 'Red blood cells'], ['Which mineral supports strong bones?', 'Calcium'],
    ['Where does digestion begin?', 'Mouth'], ['Which organ produces insulin?', 'Pancreas'],
    ['What connects muscles to bones?', 'Tendons'], ['How many chambers does a human heart have?', 'Four']
  ]),
  quiz('Science Nature and Ecosystems', 'Living things habitats and food webs', 'Science', [
    ['What do we call an animal that eats only plants?', 'Herbivore'], ['What process changes a caterpillar into a butterfly?', 'Metamorphosis'],
    ['Which organisms break down dead material?', 'Decomposers'], ['What is the natural home of an organism?', 'Habitat'],
    ['Which layer of a forest receives the most sunlight?', 'Canopy'], ['What do plants release during photosynthesis?', 'Oxygen'],
    ['What is a relationship where both species benefit?', 'Mutualism'], ['Which biome receives very little rainfall?', 'Desert'],
    ['What starts most food chains?', 'Plants'], ['Which term describes all living and nonliving parts together?', 'Ecosystem']
  ]),
  quiz('Science Matter and Energy', 'Foundations of physics and chemistry', 'Science', [
    ['What is the smallest unit of an element?', 'Atom'], ['Which state of matter fills its container?', 'Gas'],
    ['What is stored energy called?', 'Potential energy'], ['What type of energy does a moving object have?', 'Kinetic energy'],
    ['What is the centre of an atom called?', 'Nucleus'], ['Which particle has a negative charge?', 'Electron'],
    ['What change turns liquid into gas?', 'Evaporation'], ['Which material allows electricity to flow easily?', 'Conductor'],
    ['What unit measures electric current?', 'Ampere'], ['What does a catalyst do to a reaction?', 'Speeds it up']
  ]),

  quiz('History Ancient Civilisations', 'Early societies and their achievements', 'History', [
    ['Which civilisation developed along the Nile?', 'Ancient Egypt'], ['Which civilisation built cities such as Harappa?', 'Indus Valley'],
    ['Which people created cuneiform writing?', 'Sumerians'], ['Which city was central to the ancient Roman Empire?', 'Rome'],
    ['Which civilisation used democracy in Athens?', 'Ancient Greece'], ['Which dynasty built much of the early Great Wall?', 'Qin dynasty'],
    ['Which civilisation built Chichén Itzá?', 'Maya'], ['Which empire used roads across the Andes?', 'Inca Empire'],
    ['Which ancient city had Hanging Gardens in tradition?', 'Babylon'], ['Which people founded Carthage?', 'Phoenicians']
  ]),
  quiz('History Explorers and Journeys', 'Voyages that changed maps and knowledge', 'History', [
    ['Who reached India by sea from Europe in 1498?', 'Vasco da Gama'], ['Who led the first expedition to circumnavigate Earth?', 'Ferdinand Magellan'],
    ['Who travelled the Silk Road and wrote about Asia?', 'Marco Polo'], ['Who reached the South Pole first?', 'Roald Amundsen'],
    ['Who was the first woman to fly solo across the Atlantic?', 'Amelia Earhart'], ['Who mapped much of the Pacific for Britain?', 'James Cook'],
    ['Who journeyed through Africa and wrote extensive travel accounts?', 'Ibn Battuta'], ['Who was the first human in space?', 'Yuri Gagarin'],
    ['Who led the 1804 expedition across western North America?', 'Meriwether Lewis'], ['Who first reached the summit of Everest with Tenzing Norgay?', 'Edmund Hillary']
  ]),
  quiz('History Landmarks and Heritage', 'Famous places and the cultures behind them', 'History', [
    ['In which country is Petra located?', 'Jordan'], ['In which country is Angkor Wat located?', 'Cambodia'],
    ['In which country is the Colosseum located?', 'Italy'], ['In which country is the Taj Mahal located?', 'India'],
    ['In which country is Stonehenge located?', 'United Kingdom'], ['In which country is the Alhambra located?', 'Spain'],
    ['In which country is Chichén Itzá located?', 'Mexico'], ['In which country is Borobudur located?', 'Indonesia'],
    ['In which country is the Acropolis located?', 'Greece'], ['In which country is the ancient city of Bagan located?', 'Myanmar']
  ]),
  quiz('History World Turning Points', 'Events that shaped the modern world', 'History', [
    ['In which year did World War II end?', '1945'], ['Which invention is associated with Johannes Gutenberg?', 'Printing press'],
    ['Which document was signed in England in 1215?', 'Magna Carta'], ['Which revolution began in France in 1789?', 'French Revolution'],
    ['Which movement sought voting rights for women?', 'Suffrage movement'], ['Which wall fell in Germany in 1989?', 'Berlin Wall'],
    ['Which organisation was founded in 1945 to support international peace?', 'United Nations'], ['Which disease was eradicated globally through vaccination?', 'Smallpox'],
    ['Which transport breakthrough is linked to the Wright brothers?', 'Powered flight'], ['Which network began as ARPANET?', 'Internet']
  ], 'medium', 40)
];
