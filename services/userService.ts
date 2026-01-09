// Этот сервис имитирует проверку базы данных просмотренных фильмов.
// Сюда добавлены все фильмы из предоставленного CSV файла.

const WATCHED_DB: Record<string, number> = {
  // Recent ratings from profile
  "tt14948432": 10, // Red One
  "tt4729430": 10,  // Klaus
  "tt0363547": 6,   // Dawn of the Dead
  "tt0095016": 8,   // Die Hard
  "tt0388473": 8,   // Tokyo Godfathers
  "tt0304669": 7,   // The Santa Clause 2
  "tt0111070": 7,   // The Santa Clause
  "tt1528854": 5,   // Daddy's Home
  "tt0088247": 6,   // The Terminator
  "tt0103064": 8,   // Terminator 2: Judgment Day
  "tt2294629": 7,   // Frozen
  "tt0118617": 6,   // Anastasia
  "tt1663202": 8,   // The Revenant
  "tt1446192": 6,   // Rise of the Guardians
  "tt2226597": 7,   // The Mountain Between Us
  "tt0314331": 6,   // Love Actually
  "tt12003946": 9,  // Violent Night
  "tt5362988": 8,   // Wind River
  "tt0385752": 5,   // The Golden Compass
  "tt0905372": 6,   // The Thing
  "tt1402488": 6,   // Happy Feet 2
  "tt0366548": 8,   // Happy Feet
  "tt1521197": 6,   // Anonymous
  "tt0081505": 7,   // The Shining
  "tt27775403": 8,  // Riff Raff
  "tt3402236": 7,   // Murder on the Orient Express
  "tt0499448": 6,   // The Chronicles of Narnia: Prince Caspian
  "tt0373469": 7,   // Kiss Kiss Bang Bang
  "tt0295721": 6,   // Taxi 3
  "tt0338013": 7,   // Eternal Sunshine of the Spotless Mind
  "tt0116282": 8,   // Fargo
  "tt0426931": 10,  // August Rush
  "tt1049413": 9,   // Up
  "tt6865690": 10,  // The Professor
  "tt0338526": 8,   // Van Helsing
  "tt19713090": 6,  // Deo killeo: Jugeodo doeneun ai
  "tt1210819": 9,   // The Lone Ranger
  "tt8866456": 9,   // The Legend of Ochi
  "tt9203694": 1,   // Stowaway
  "tt28996126": 4,  // Nobody 2
  "tt27503384": 8,  // Perfect Days
  "tt6791096": 7,   // I Feel Pretty
  "tt0899043": 6,   // The Amateur
  "tt0263265": 4,   // The Devil and Daniel Webster
  "tt1515091": 8,   // Sherlock Holmes: A Game of Shadows
  "tt0988045": 7,   // Sherlock Holmes
  "tt27196021": 10, // Small Things Like These
  "tt0187738": 8,   // Blade II
  "tt10374610": 6,  // The Long Walk
  "tt1623288": 9,   // ParaNorman
  "tt8228288": 7,   // El hoyo
  "tt1231583": 6,   // Due Date
  "tt0120611": 7,   // Blade
  "tt7574556": 10,  // Dead of Winter
  "tt0043338": 7,   // Ace in the Hole
  "tt1911644": 5,   // The Call
  "tt1073498": 5,   // Meet the Spartans
  "tt0203019": 7,   // Men of Honor
  "tt0309291": 6,   // Aoi haru
  "tt0780536": 7,   // In Bruges
  "tt0083658": 6,   // Blade Runner
  "tt1856101": 10,  // Blade Runner 2049
  "tt0368891": 7,   // National Treasure
  "tt1083452": 5,   // Eddie the Eagle
  "tt11097384": 7,  // Spaceman
  "tt0272152": 9,   // K-PAX
  "tt0162661": 9,   // Sleepy Hollow
  "tt6803046": 4,   // The Vast of Night
  "tt14509110": 6,  // No One Will Save You
  "tt31036941": 3,  // Jurassic World: Rebirth
  "tt1638355": 6,   // The Man from U.N.C.L.E.
  "tt4276820": 10,  // The Founder
  "tt2554274": 8,   // Crimson Peak
  "tt2567026": 5,   // Alice Through the Looking Glass
  "tt1666186": 4,   // Vampires Suck
  "tt4667094": 5,   // Fifty Shades of Black
  "tt1014759": 10,  // Alice in Wonderland
  "tt2828996": 4,   // A Haunted House 2
  "tt2243537": 6,   // A Haunted House
  "tt28015403": 9,  // Heretic
  "tt4034354": 8,   // Swiss Army Man
  "tt1981128": 5,   // Geostorm
  "tt0258000": 9,   // Panic Room
  "tt0450259": 7,   // Blood Diamond
  "tt4495098": 6,   // Gran Turismo
  "tt0218967": 6,   // The Family Man
  "tt1048049": 7,   // Devil May Cry
  "tt13623632": 2,  // Alien: Earth
  "tt31806037": 7,  // Adolescence
  "tt11127680": 7,  // Boiling Point
  "tt26581740": 8,  // Weapons
  "tt0386676": 10,  // The Office
  "tt4209788": 7,   // Molly's Game
  "tt3659388": 8,   // The Martian
  "tt5420210": 5,   // The Comeback Trail
  "tt0401792": 7,   // Sin City
  "tt0096163": 1,   // Spoorloos
  "tt1535108": 6,   // Elysium
  "tt0146316": 6,   // Lara Croft: Tomb Raider
  "tt1714203": 6,   // Piranha 3DD
  "tt0464154": 6,   // Piranha 3D
  "tt0425123": 6,   // Just Like Heaven
  "tt0356910": 5,   // Mr. & Mrs. Smith
  "tt3787590": 8,   // We Are Your Friends
  "tt3569230": 7,   // Legend
  "tt0246989": 2,   // Tomcats
  "tt15153532": 8,  // Strays
  "tt0360486": 6,   // Constantine
  "tt8367814": 9,   // The Gentlemen
  "tt0118971": 7,   // The Devil's Advocate
  "tt3420504": 6,   // Finch
  "tt18815410": 1,  // The Quarry
  "tt7063210": 8,   // The Place
  "tt27489557": 9,  // Abigail
  "tt0108052": 8,   // Schindler's List
  "tt3631112": 8,   // The Girl on the Train
  "tt0480249": 8,   // I Am Legend
  "tt0463854": 5,   // 28 Weeks Later
  "tt0289043": 6,   // 28 Days Later...
  "tt1865718": 10,  // Gravity Falls
  "tt0892769": 10,  // How to Train Your Dragon
  "tt28821588": 5,  // Le mangeur d'âmes
  "tt1646971": 8,   // How to Train Your Dragon 2
  "tt0963966": 10,  // The Sorcerer's Apprentice
  "tt13433802": 4,  // A Quiet Place: Day One
  "tt8332922": 6,   // A Quiet Place Part II
  "tt0378194": 8,   // Kill Bill: Vol. 2
  "tt0266697": 8,   // Kill Bill: Vol. 1
  "tt2383068": 2,   // The Sacrament
  "tt5638642": 5,   // The Ritual
  "tt1213641": 7,   // First Man
  "tt1174954": 6,   // Resident Evil: Degeneration
  "tt0432021": 5,   // Resident Evil: Extinction
  "tt0457430": 7,   // Pan's Labyrinth
  "tt0318627": 6,   // Resident Evil: Apocalypse
  "tt0120804": 9,   // Resident Evil
  "tt11138512": 6,  // The Northman
  "tt1210166": 8,   // Moneyball
  "tt0175880": 5,   // Magnolia
  "tt3704050": 10,  // Remember
  "tt0314979": 5,   // Battlestar Galactica
  "tt1267379": 8,   // Dead Space: Downfall
  "tt0119081": 6,   // Event Horizon
  "tt5834426": 4,   // Moonfall
  "tt1622547": 6,   // 30 Minutes or Less
  "tt0114214": 7,   // The Quick and the Dead
  "tt6742252": 9,   // The Guilty
  "tt15838850": 5,  // The Roundup
  "tt7468056": 6,   // Beomjoidosi
  "tt3566834": 8,   // A Minecraft Movie
  "tt0076101": 7,   // Bluff storia di truffe e di imbroglioni
  "tt16900880": 7,  // Gil Bok-soon
  "tt0083944": 5,   // First Blood
  "tt13957560": 8,  // Dumb Money
  "tt1596363": 8,   // The Big Short
  "tt7740496": 8,   // Nightmare Alley
  "tt11286314": 6,  // Don't Look Up
  "tt1504320": 9,   // The King's Speech
  "tt0838221": 7,   // The Darjeeling Limited
  "tt6654210": 5,   // Infinite
  "tt11177804": 7,  // Jiang Ziya
  "tt10627720": 6,  // Nezha: Mo tong jiang shi
  "tt7605074": 4,   // The Wandering Earth
  "tt0770828": 7,   // Man of Steel
  "tt9224104": 2,   // Meg 2: The Trench
  "tt1542344": 7,   // 127 Hours
  "tt12593682": 9,  // Bullet Train
  "tt1136608": 6,   // District 9
  "tt0416449": 7,   // 300
  "tt1034389": 7,   // The Eagle
  "tt1483013": 3,   // Oblivion
  "tt1979320": 6,   // Rush
  "tt6741278": 9,   // Invincible
  "tt1446714": 6,   // Prometheus
  "tt0974959": 7,   // American Pie Presents: Beta House
  "tt4781612": 6,   // Imperium
  "tt7349662": 9,   // BlacKkKlansman
  "tt12590266": 10, // Cyberpunk: Edgerunners
  "tt0399295": 6,   // Lord of War
  "tt10366460": 8,  // CODA
  "tt2231461": 6,   // Rampage
  "tt23561236": 8,  // American Fiction
  "tt10332508": 9,  // Primal
  "tt1656190": 7,   // Safe
  "tt11126994": 10, // Arcane
  "tt0090605": 8,   // Aliens
  "tt0078748": 8,   // Alien
  "tt1060277": 5,   // Cloverfield
  "tt1179933": 7,   // 10 Cloverfield Lane
  "tt4779682": 5,   // The Meg (note: duplicate ID in CSV, overwritten by this one)
  "tt2548396": 2,   // The Cloverfield Paradox
  "tt1188729": 6,   // Pandorum
  "tt0470752": 6,   // Ex Machina
  "tt1631867": 7,   // Edge of Tomorrow
  "tt1182345": 7,   // Moon
  "tt1259521": 8,   // The Cabin in the Woods
  "tt2543164": 7,   // Arrival
  "tt12758060": 3,  // Tetris
  "tt5153956": 2,   // Last Sentinel
  "tt0448134": 7,   // Sunshine
  "tt0816692": 10,  // Interstellar
};

export const getUserRating = async (imdbID: string): Promise<number | undefined> => {
  // Имитация асинхронного запроса
  return new Promise((resolve) => {
    // Нормализация ID (иногда приходят без tt)
    const cleanID = imdbID.startsWith('tt') ? imdbID : `tt${imdbID}`;
    const rating = WATCHED_DB[cleanID];
    resolve(rating);
  });
};