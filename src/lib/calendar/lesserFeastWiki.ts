// english wikipedia articles for the lesser feasts, keyed by slug. only
// titles verified against the live encyclopedia belong here; a slug without
// an entry falls back to a wikipedia search built from the feast's name.
export type LesserFeastWikiLink = {
  /** english wikipedia article title. */
  title: string;
  /** label shown in the app, defaults to the article title. */
  label?: string;
};

export const LESSER_FEAST_WIKI: Record<string, LesserFeastWikiLink[]> = {
  "absalom-jones-priest": [{ title: "Absalom Jones" }],
  "adelaide-teague-case-educator": [{ title: "Adelaide Teague Case" }],
  "adeline-blanchard-tyler-and-her-companions": [
    { title: "Adeline Blanchard Tyler" },
  ],
  "aelred-of-rievaulx-monastic-and-theologian": [
    { title: "Aelred of Rievaulx" },
  ],
  "agatha-of-sicily-martyr-251": [{ title: "Agatha of Sicily" }],
  "agnes-and-cecilia-of-rome-martyrs-304-and-230": [
    { title: "Agnes of Rome" },
    { title: "Cecilia of Rome" },
  ],
  "agnes-tsao-kou-ying-agatha-lin-zhao-and-lucy-yi-zhenmei-catechists-and-martyrs":
    [
      { title: "Agnes Tsao Kou Ying" },
      { title: "Agatha Lin", label: "Agatha Lin Zhao" },
      { title: "Lucy Yi Zhenmei" },
    ],
  "aidan-of-lindisfarne-bishop-651": [{ title: "Aidan of Lindisfarne" }],
  "alban-martyr-304": [{ title: "Saint Alban", label: "Alban" }],
  "alcuin-of-york-deacon-804": [{ title: "Alcuin" }],
  "alexander-crummell-priest": [{ title: "Alexander Crummell" }],
  "alfred-king-899": [{ title: "Alfred the Great", label: "Alfred, King" }],
  "all-souls-all-the-faithful-departed": [{ title: "All Souls' Day" }],
  "alphege-archbishop-of-canterbury-and-martyr": [
    { title: "Ælfheah of Canterbury", label: "Alphege" },
  ],
  "ambrose-of-milan-bishop-and-theologian-397": [
    { title: "Ambrose", label: "Ambrose of Milan" },
  ],
  "ammonius-hermit-403": [{ title: "Saint Amun", label: "Ammonius, Hermit" }],
  "anna-ellison-butler-alexander-deaconess-and-teacher": [
    { title: "Anna Alexander", label: "Anna Ellison Butler Alexander" },
  ],
  "anna-julia-haywood-cooper-educator": [
    { title: "Anna J. Cooper", label: "Anna Julia Haywood Cooper" },
  ],
  "anselm-archbishop-of-canterbury-and-theologian": [
    { title: "Anselm of Canterbury" },
  ],
  "anskar-bishop-and-missionary-865": [{ title: "Ansgar" }],
  "antony-of-egypt-monastic-356": [
    { title: "Anthony the Great", label: "Antony of Egypt" },
  ],
  "argula-von-grumbach-scholar-and-church-reformer": [
    { title: "Argula von Grumbach" },
  ],
  "athanasius-of-alexandria-bishop-and-theologian-373": [
    { title: "Athanasius of Alexandria" },
  ],
  "augustine-first-archbishop-of-canterbury-605": [
    { title: "Augustine of Canterbury" },
  ],
  "augustine-of-hippo-bishop-and-theologian-430": [
    { title: "Augustine of Hippo" },
  ],
  "bakhita-josephine-margaret-bakhita-monastic": [
    {
      title: "Josephine Bakhita",
      label: "Bakhita (Josephine Margaret Bakhita)",
    },
  ],
  "basil-of-caesarea-bishop-and-theologian-379": [
    { title: "Basil of Caesarea" },
  ],
  "bede-priest-and-historian-735": [{ title: "Bede" }],
  "beheading-of-saint-john-the-baptist": [
    { title: "Beheading of John the Baptist" },
  ],
  "benedict-of-nursia-monastic-543": [{ title: "Benedict of Nursia" }],
  "bernard-mizeki-martyr": [{ title: "Bernard Mizeki" }],
  "bernard-of-clairvaux-monastic-and-theologian": [
    { title: "Bernard of Clairvaux" },
  ],
  "birgitta-of-sweden-mystic": [{ title: "Bridget of Sweden" }],
  "blandina-and-her-companions-the-martyrs-of-lyons-177": [
    { title: "Blandina" },
  ],
  "boniface-bishop-and-missionary-754": [
    { title: "Saint Boniface", label: "Boniface" },
  ],
  "brigid-of-kildare-monastic-523": [{ title: "Brigid of Kildare" }],
  "catherine-of-alexandria-barbara-of-nicomedia-and-margaret-of-antioch-martyrs-305":
    [
      { title: "Catherine of Alexandria" },
      { title: "Saint Barbara" },
      { title: "Margaret the Virgin" },
    ],
  "catherine-of-genoa-mystic-and-nurse": [{ title: "Catherine of Genoa" }],
  "catherine-of-siena-mystic-and-prophetic-witness": [
    { title: "Catherine of Siena" },
  ],
  "chad-of-lichfield-bishop-672": [
    { title: "Chad of Mercia", label: "Chad of Lichfield" },
  ],
  "channing-moore-williams-bishop-and-missionary": [
    { title: "Channing Moore Williams" },
  ],
  "charles-de-foucauld-monastic-and-martyr": [{ title: "Charles de Foucauld" }],
  "charles-henry-brent-bishop": [
    { title: "Charles Brent", label: "Charles Henry Brent" },
  ],
  "charles-simeon-priest": [{ title: "Charles Simeon" }],
  "clare-of-assisi-monastic": [{ title: "Clare of Assisi" }],
  "clement-of-alexandria-priest-and-theologian-210": [
    { title: "Clement of Alexandria" },
  ],
  "clement-of-rome-bishop-100": [{ title: "Clement of Rome" }],
  "clive-staples-lewis-apologist-and-spiritual-writer": [
    { title: "C. S. Lewis", label: "Clive Staples Lewis" },
  ],
  "columba-of-iona-monastic-597": [{ title: "Columba" }],
  "consecration-of-barbara-clementine-harris-first-woman-bishop-in-the-anglican-communion":
    [
      {
        title: "Barbara Harris (bishop)",
        label: "Consecration of Barbara Clementine Harris",
      },
    ],
  "consecration-of-samuel-seabury": [
    { title: "Samuel Seabury", label: "Consecration of Samuel Seabury" },
  ],
  "constance-thecla-ruth-frances-charles-parsons-and-louis-schuyler-martyrs": [
    { title: "Martyrs of Memphis", label: "Constance and her Companions" },
  ],
  "cornelius-the-centurion": [{ title: "Cornelius the Centurion" }],
  "cuthbert-bishop-687": [{ title: "Cuthbert" }],
  "cyprian-of-carthage-bishop-and-martyr-258": [{ title: "Cyprian" }],
  "cyril-and-methodius-missionaries-869-and-885": [
    { title: "Cyril and Methodius" },
  ],
  "cyril-of-jerusalem-bishop-and-theologian-386": [
    { title: "Cyril of Jerusalem" },
  ],
  "damien-priest-and-marianne-cope-monastic-of-hawaii": [
    { title: "Father Damien", label: "Damien" },
    { title: "Marianne Cope" },
  ],
  "david-of-wales-bishop-544": [{ title: "Saint David" }],
  "david-pendleton-oakerhater-deacon": [
    { title: "David Pendleton Oakerhater" },
  ],
  "dietrich-bonhoeffer-pastor-and-theologian": [
    { title: "Dietrich Bonhoeffer" },
  ],
  "dominic-priest-and-friar": [{ title: "Saint Dominic", label: "Dominic" }],
  "dorothy-l-sayers-apologist-and-spiritual-writer": [
    { title: "Dorothy L. Sayers" },
  ],
  "dunstan-archbishop-of-canterbury-988": [{ title: "Dunstan" }],
  "edith-cavell-nurse": [{ title: "Edith Cavell" }],
  "edith-stein-teresa-benedicta-of-the-cross-philosopher-monastic-and-martyr": [
    {
      title: "Edith Stein",
      label: "Edith Stein (Teresa Benedicta of the Cross)",
    },
  ],
  "edmund-king-870": [{ title: "Edmund the Martyr", label: "Edmund, King" }],
  "edward-bouverie-pusey-priest": [{ title: "Edward Bouverie Pusey" }],
  "elie-naud": [{ title: "Elias Neau", label: "Élie Naud" }],
  "elisabeth-cruciger-poet-and-hymnographer": [{ title: "Elisabeth Cruciger" }],
  "elizabeth-ann-seton-vowed-religious-and-educator": [
    { title: "Elizabeth Ann Seton" },
  ],
  "elizabeth-cady-stanton-amelia-bloomer-and-sojourner-truth-social-reformers":
    [
      { title: "Elizabeth Cady Stanton" },
      { title: "Amelia Bloomer" },
      { title: "Sojourner Truth" },
    ],
  "elizabeth-of-hungary-princess": [{ title: "Elizabeth of Hungary" }],
  "emily-malbone-morgan-lay-leader-and-contemplative": [
    { title: "Emily Malbone Morgan" },
  ],
  "enmegahbowh-priest-and-missionary": [{ title: "Enmegahbowh" }],
  "ephrem-of-nisibis-deacon-and-poet-373": [
    { title: "Ephrem the Syrian", label: "Ephrem of Nisibis" },
  ],
  "euphrosyne-smaragdus-of-alexandria-monastic-fifth-century": [
    {
      title: "Euphrosyne of Alexandria",
      label: "Euphrosyne/Smaragdus of Alexandria",
    },
  ],
  "eva-lee-matthews-monastic": [{ title: "Eva Lee Matthews" }],
  "evelyn-underhill-mystic-and-writer": [{ title: "Evelyn Underhill" }],
  "fabian-bishop-and-martyr-250": [{ title: "Pope Fabian", label: "Fabian" }],
  "first-book-of-common-prayer": [
    {
      title: "Book of Common Prayer (1549)",
      label: "The First Book of Common Prayer",
    },
  ],
  "florence-li-tim-oi-priest": [{ title: "Florence Li Tim-Oi" }],
  "florence-nightingale-nurse": [{ title: "Florence Nightingale" }],
  "frances-joseph-gaudet-educator-and-social-reformer": [
    { title: "Frances Joseph-Gaudet" },
  ],
  "frances-perkins-social-reformer": [{ title: "Frances Perkins" }],
  "francis-de-sales-bishop-and-jane-de-chantal-vowed-religious": [
    { title: "Francis de Sales" },
    { title: "Jane Frances de Chantal", label: "Jane de Chantal" },
  ],
  "francis-of-assisi-friar-and-deacon": [{ title: "Francis of Assisi" }],
  "francis-xavier-priest-and-missionary": [{ title: "Francis Xavier" }],
  "frederick-denison-maurice-priest": [
    { title: "F. D. Maurice", label: "Frederick Denison Maurice" },
  ],
  "frederick-douglass-social-reformer": [{ title: "Frederick Douglass" }],
  "frederick-howden-jr-priest-and-chaplain-of-the-armed-forces": [
    { title: "Frederick B. Howden Jr.", label: "Frederick Howden, Jr." },
  ],
  "george-augustus-selwyn-bishop": [
    {
      title: "George Selwyn (bishop of Lichfield)",
      label: "George Augustus Selwyn",
    },
  ],
  "george-herbert-priest-and-poet": [{ title: "George Herbert" }],
  "george-of-lydda-soldier-and-martyr-304": [
    { title: "Saint George", label: "George of Lydda" },
  ],
  "gregory-of-nazianzus-bishop-and-theologian-389": [
    { title: "Gregory of Nazianzus" },
  ],
  "gregory-of-nyssa-bishop-and-theologian-394": [{ title: "Gregory of Nyssa" }],
  "gregory-the-great-bishop-and-theologian-604": [
    { title: "Pope Gregory I", label: "Gregory the Great" },
  ],
  "gregory-the-illuminator-bishop-and-missionary-332": [
    { title: "Gregory the Illuminator" },
  ],
  "hadewijch-of-brabant-poet-and-mystic-thirteenth-century": [
    { title: "Hadewijch", label: "Hadewijch of Brabant" },
  ],
  "hannah-more-religious-writer-and-philanthropist": [{ title: "Hannah More" }],
  "harriet-bedell-deaconess-and-missionary": [{ title: "Harriet Bedell" }],
  "harriet-monsell-monastic": [{ title: "Harriet Monsell" }],
  "harriet-ross-tubman-social-reformer": [{ title: "Harriet Tubman" }],
  "harriet-starr-cannon-monastic": [{ title: "Harriet Starr Cannon" }],
  "helena-of-constantinople-protector-of-the-holy-places-330": [
    {
      title: "Helena, mother of Constantine I",
      label: "Helena of Constantinople",
    },
  ],
  "henry-martyn-priest-and-missionary": [{ title: "Henry Martyn" }],
  "herman-of-alaska-missionary": [{ title: "Herman of Alaska" }],
  "hilary-of-poitiers-bishop-367": [{ title: "Hilary of Poitiers" }],
  "hilda-of-whitby-abbess-680": [{ title: "Hilda of Whitby" }],
  "hildegard-of-bingen-mystic-and-scholar": [{ title: "Hildegard of Bingen" }],
  "hugh-latimer-and-nicholas-ridley-bishops-and-martyrs-and-thomas-cranmer-archbishop-of-canterbury":
    [
      { title: "Hugh Latimer" },
      { title: "Nicholas Ridley (martyr)", label: "Nicholas Ridley" },
      { title: "Thomas Cranmer" },
    ],
  "hugh-of-lincoln-bishop": [{ title: "Hugh of Lincoln" }],
  "ignatius-of-antioch-bishop-and-martyr-115": [
    { title: "Ignatius of Antioch" },
  ],
  "ignatius-of-loyola-priest-and-spiritual-writer": [
    { title: "Ignatius of Loyola" },
  ],
  "irenaeus-of-lyons-bishop-and-theologian-202": [{ title: "Irenaeus" }],
  "isabel-florence-hapgood-ecumenist": [{ title: "Isabel Florence Hapgood" }],
  "jackson-kemper-bishop-and-missionary": [{ title: "Jackson Kemper" }],
  "james-de-koven-priest": [
    { title: "James DeKoven", label: "James De Koven" },
  ],
  "james-hannington-bishop-and-his-companions-martyrs": [
    { title: "James Hannington" },
  ],
  "james-lloyd-breck-priest": [{ title: "James Lloyd Breck" }],
  "james-otis-sargent-huntington-monastic-and-priest": [
    { title: "James Huntington", label: "James Otis Sargent Huntington" },
  ],
  "james-solomon-russell-priest": [{ title: "James Solomon Russell" }],
  "james-theodore-holly-bishop": [{ title: "James Theodore Holly" }],
  "janani-luwum-archbishop-and-martyr": [{ title: "Janani Luwum" }],
  "jeremy-taylor-bishop-and-theologian": [{ title: "Jeremy Taylor" }],
  "jerome-priest-and-scholar-420": [{ title: "Jerome" }],
  "joanna-mary-and-salome-myrrh-bearing-women": [
    {
      title: "Myrrhbearers",
      label: "Joanna, Mary, and Salome, Myrrh-Bearing Women",
    },
  ],
  "johann-arndt-and-jacob-boehme-mystics": [
    { title: "Johann Arndt" },
    { title: "Jakob Böhme" },
  ],
  "johann-sebastian-bach-composer": [{ title: "Johann Sebastian Bach" }],
  "john-and-charles-wesley-priests": [
    { title: "John Wesley" },
    { title: "Charles Wesley" },
  ],
  "john-cassian-monastic-and-theologian-435": [{ title: "John Cassian" }],
  "john-chrysostom-bishop-and-theologian-407": [{ title: "John Chrysostom" }],
  "john-coleridge-patteson-bishop-and-his-companions-martyrs": [
    { title: "John Coleridge Patteson" },
  ],
  "john-donne-priest-and-poet": [{ title: "John Donne" }],
  "john-henry-hobart-bishop": [{ title: "John Henry Hobart" }],
  "john-keble-priest-and-poet": [{ title: "John Keble" }],
  "john-mason-neale-priest-and-hymnographer": [{ title: "John Mason Neale" }],
  "john-of-damascus-priest-and-theologian-760": [{ title: "John of Damascus" }],
  "john-of-the-cross-mystic-and-monastic-reformer": [
    { title: "John of the Cross" },
  ],
  "john-raleigh-mott-ecumenist-and-missionary": [
    { title: "John Mott", label: "John Raleigh Mott" },
  ],
  "john-xxiii-angelo-giuseppe-roncalli-bishop": [{ title: "Pope John XXIII" }],
  "jonathan-myrick-daniels-martyr": [
    { title: "Jonathan Daniels", label: "Jonathan Myrick Daniels" },
  ],
  "joseph-butler-bishop-and-theologian": [{ title: "Joseph Butler" }],
  "joseph-of-arimathea": [{ title: "Joseph of Arimathea" }],
  "juana-ines-de-la-cruz-monastic-and-theologian": [
    { title: "Juana Inés de la Cruz" },
  ],
  "julia-chester-emery-lay-leader-and-missionary": [
    { title: "Julia Chester Emery" },
  ],
  "julian-of-norwich-mystic-and-theologian": [{ title: "Julian of Norwich" }],
  "justin-martyr-167": [{ title: "Justin Martyr", label: "Justin, Martyr" }],
  "kamehameha-and-emma-of-hawaii-king-and-queen": [
    { title: "Kamehameha IV", label: "Kamehameha IV of Hawai‘i" },
    { title: "Queen Emma of Hawaii", label: "Emma of Hawai‘i" },
  ],
  "kassiani-poet-and-hymnographer-865": [{ title: "Kassia" }],
  "kateri-tekakwitha-lay-contemplative": [{ title: "Kateri Tekakwitha" }],
  "katharina-von-bora-church-reformer": [{ title: "Katharina von Bora" }],
  "katharina-zell-church-reformer-and-writer": [{ title: "Katharina Zell" }],
  "lancelot-andrewes-bishop": [{ title: "Lancelot Andrewes" }],
  "laurence-of-rome-deacon-and-martyr-258": [{ title: "Saint Lawrence" }],
  "leo-of-rome-bishop-461": [{ title: "Pope Leo I", label: "Leo of Rome" }],
  "liliuokalani-of-hawaii": [
    { title: "Liliʻuokalani", label: "Lili‘uokalani" },
  ],
  "louis-king": [
    { title: "Louis IX of France", label: "Louis, King of France" },
  ],
  "lucy-of-syracuse-martyr-304": [
    { title: "Saint Lucy", label: "Lucy of Syracuse" },
  ],
  "lydia-of-thyatira-coworker-of-the-apostle-paul": [
    { title: "Lydia of Thyatira" },
  ],
  "macrina-of-caesarea-monastic-and-teacher-379": [
    { title: "Macrina the Younger", label: "Macrina of Caesarea" },
  ],
  "manche-masemola-martyr": [{ title: "Manche Masemola" }],
  "marcella-of-rome-monastic-and-scholar-410": [{ title: "Marcella of Rome" }],
  "margaret-of-cortona-monastic": [{ title: "Margaret of Cortona" }],
  "margaret-of-scotland-queen": [
    { title: "Saint Margaret of Scotland", label: "Margaret of Scotland" },
  ],
  "margaret-ward-margaret-clitherow-and-anne-line-martyrs": [
    { title: "Margaret Ward" },
    { title: "Margaret Clitherow" },
    { title: "Anne Line" },
  ],
  "maria-skobtsova-monastic-and-martyr": [{ title: "Maria Skobtsova" }],
  "marina-the-monk-monastic-fifth-century": [{ title: "Marina the Monk" }],
  "martin-luther-king-jr-pastor-and-martyr": [
    { title: "Martin Luther King Jr." },
  ],
  "martin-luther-pastor-and-reformer": [{ title: "Martin Luther" }],
  "martin-of-tours-bishop-397": [{ title: "Martin of Tours" }],
  "martyrs-of-japan": [
    { title: "26 Martyrs of Japan", label: "The Martyrs of Japan, 1597" },
  ],
  "martyrs-of-new-guinea": [
    { title: "Martyrs of New Guinea", label: "The Martyrs of New Guinea" },
  ],
  "martyrs-of-uganda": [
    { title: "Uganda Martyrs", label: "The Martyrs of Uganda" },
  ],
  "mary-and-martha-of-bethany": [
    { title: "Mary of Bethany" },
    { title: "Martha" },
  ],
  "mary-of-egypt-monastic-421": [{ title: "Mary of Egypt" }],
  "mechthild-of-magdeburg-mystic": [{ title: "Mechthild of Magdeburg" }],
  "mechthilde-of-hackeborn-and-gertrude-the-great-mystics-and-theologians": [
    { title: "Mechthild of Hackeborn" },
    { title: "Gertrude the Great" },
  ],
  "melania-the-elder-monastic-410": [{ title: "Melania the Elder" }],
  "monica-mother-of-augustine-of-hippo-387": [{ title: "Saint Monica" }],
  "moses-the-black-monastic-and-martyr-400": [{ title: "Moses the Black" }],
  "nicholas-ferrar-deacon": [{ title: "Nicholas Ferrar" }],
  "nicholas-of-myra-bishop-342": [
    { title: "Saint Nicholas", label: "Nicholas of Myra" },
  ],
  "ninian-bishop-430": [{ title: "Ninian", label: "Ninian of Whithorn" }],
  "nino-of-georgia-missionary-332": [{ title: "Saint Nino" }],
  "ordination-of-the-philadelphia-eleven": [
    {
      title: "Philadelphia Eleven",
      label: "The Ordination of the Philadelphia Eleven",
    },
  ],
  "oscar-romero-archbishop-and-martyr-and-the-martyrs-of-el-salvador": [
    { title: "Óscar Romero" },
    { title: "1980 murders of U.S. missionaries in El Salvador" },
    { title: "1989 murders of Jesuits in El Salvador" },
  ],
  "pachomius-of-tabenissi-monastic-348": [
    { title: "Pachomius the Great", label: "Pachomius of Tabenissi" },
  ],
  "parents-of-the-blessed-virgin-mary": [
    { title: "Joachim" },
    { title: "Saint Anne", label: "Anne" },
  ],
  "patrick-of-ireland-bishop-and-missionary-461": [
    { title: "Saint Patrick", label: "Patrick of Ireland" },
  ],
  "paul-jones-bishop": [{ title: "Paul Jones (bishop)", label: "Paul Jones" }],
  "paula-and-eustochium-of-rome-monastics-and-scholars-404-and-419": [
    { title: "Paula of Rome", label: "Paula" },
    { title: "Eustochium" },
  ],
  "pauli-murray-priest": [{ title: "Pauli Murray" }],
  "perpetua-and-felicity-martyrs-202": [{ title: "Perpetua and Felicity" }],
  "peter-williams-cassey-deacon-and-anna-besant-cassey": [
    { title: "Peter William Cassey", label: "Peter Williams Cassey" },
  ],
  "philander-chase-bishop": [{ title: "Philander Chase" }],
  "philip-deacon-and-evangelist": [
    { title: "Philip the Evangelist", label: "Philip, Deacon and Evangelist" },
  ],
  "phillips-brooks-bishop": [{ title: "Phillips Brooks" }],
  "phoebe-deacon": [{ title: "Phoebe (biblical figure)" }],
  "photini-the-samaritan-woman-67": [
    {
      title: "Samaritan woman at the well",
      label: "Photini, the Samaritan Woman",
    },
  ],
  "polycarp-of-smyrna-bishop-and-martyr-156": [{ title: "Polycarp" }],
  "priscilla-and-aquila-coworkers-of-the-apostle-paul": [
    { title: "Priscilla and Aquila" },
  ],
  "remigius-of-rheims-bishop-530": [
    { title: "Remigius", label: "Remigius of Reims" },
  ],
  "richard-hooker-priest-and-theologian": [{ title: "Richard Hooker" }],
  "richard-meux-benson-priest-and-charles-gore-bishop": [
    { title: "Richard Meux Benson" },
    { title: "Charles Gore" },
  ],
  "richard-of-chichester-bishop": [{ title: "Richard of Chichester" }],
  "richard-rolle-walter-hilton-and-margery-kempe-mystics": [
    { title: "Richard Rolle" },
    { title: "Walter Hilton" },
    { title: "Margery Kempe" },
  ],
  "robert-grosseteste-bishop": [{ title: "Robert Grosseteste" }],
  "samuel-isaac-joseph-schereschewsky-bishop-and-missionary": [
    { title: "Samuel Isaac Joseph Schereschewsky" },
  ],
  "sarah-theodora-and-syncletica-of-egypt-desert-mothers-fourth-fifth-century":
    [{ title: "Desert Mothers" }],
  "scholastica-monastic-543": [{ title: "Scholastica" }],
  "sergius-of-radonezh-monastic": [{ title: "Sergius of Radonezh" }],
  "simeon-bachos-the-ethiopian-eunuch": [
    { title: "Ethiopian eunuch", label: "Simeon Bachos, the Ethiopian Eunuch" },
  ],
  "tabitha-dorcas-of-joppa": [{ title: "Dorcas", label: "Tabitha (Dorcas)" }],
  "teresa-of-avila-mystic-and-monastic-reformer": [
    { title: "Teresa of Ávila" },
  ],
  "thecla-of-iconium-proto-martyr-among-women-70": [
    { title: "Thecla", label: "Thecla of Iconium" },
  ],
  "theodora-empress-867": [
    { title: "Theodora (wife of Theophilos)", label: "Theodora" },
  ],
  "theodore-of-tarsus-archbishop-of-canterbury-690": [
    { title: "Theodore of Tarsus" },
  ],
  "therese-of-lisieux-monastic": [{ title: "Thérèse of Lisieux" }],
  "thomas-a-kempis-priest-and-mystic": [{ title: "Thomas à Kempis" }],
  "thomas-aquinas-friar-and-theologian": [{ title: "Thomas Aquinas" }],
  "thomas-becket-archbishop-of-canterbury-and-martyr": [
    { title: "Thomas Becket" },
  ],
  "thomas-bray-priest-and-missionary": [{ title: "Thomas Bray" }],
  "thomas-gallaudet-and-henry-winter-syle-priests": [
    { title: "Thomas Gallaudet (priest)", label: "Thomas Gallaudet" },
    { title: "Henry Winter Syle" },
  ],
  "thomas-ken-bishop": [{ title: "Thomas Ken" }],
  "thurgood-marshall-public-servant": [{ title: "Thurgood Marshall" }],
  "tikhon-bishop-and-ecumenist": [
    { title: "Patriarch Tikhon of Moscow", label: "Tikhon of Moscow" },
  ],
  "timothy-and-titus-companions-of-saint-paul": [
    { title: "Saint Timothy", label: "Timothy" },
    { title: "Saint Titus", label: "Titus" },
  ],
  "toyohiko-kagawa-social-reformer": [{ title: "Toyohiko Kagawa" }],
  "vida-dutton-scudder-educator": [{ title: "Vida Dutton Scudder" }],
  "vincent-de-paul-priest-and-louise-de-marillac-vowed-religious-workers-of-charity":
    [{ title: "Vincent de Paul" }, { title: "Louise de Marillac" }],
  "vincent-of-saragossa-deacon-and-martyr-304": [
    { title: "Vincent of Saragossa" },
  ],
  "william-augustus-muhlenberg-priest": [
    { title: "William Augustus Muhlenberg" },
  ],
  "william-laud-archbishop-of-canterbury": [{ title: "William Laud" }],
  "william-law-priest": [{ title: "William Law" }],
  "william-reed-huntington-priest": [{ title: "William Reed Huntington" }],
  "william-temple-archbishop-of-canterbury": [
    { title: "William Temple (bishop)", label: "William Temple" },
  ],
  "william-tyndale-priest": [{ title: "William Tyndale" }],
  "william-white-bishop": [
    { title: "William White (bishop of Pennsylvania)", label: "William White" },
  ],
  "william-wilberforce-social-reformer": [{ title: "William Wilberforce" }],
  "willibrord-bishop-and-missionary-739": [{ title: "Willibrord" }],
  "wulfstan-of-worcester-bishop": [
    { title: "Wulfstan (died 1095)", label: "Wulfstan of Worcester" },
  ],
  "zenaida-philonella-and-hermione-unmercenary-physicians-100-117": [
    { title: "Zenaida and Philonella" },
    { title: "Hermione of Ephesus", label: "Hermione" },
  ],
  "zita-of-tuscany-worker-of-charity": [{ title: "Zita" }],
  // no english article names either commemoration; keep the search fallback
  "martyrs-of-the-reformation-era": [],
  "maryam-of-qidun-monastic-fourth-century": [],
};

/** direct url for a verified english wikipedia article. */
export function wikipediaArticleUrl(title: string): string {
  return `https://en.wikipedia.org/wiki/${encodeURIComponent(
    title.replace(/ /g, "_"),
  )}`;
}

/** search url for a feast without a verified article. */
export function wikipediaSearchUrl(name: string): string {
  return `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(name)}`;
}
