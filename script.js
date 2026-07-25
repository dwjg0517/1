/* =========================================================
   墨梅易数 · Divination Engine & UI
   ========================================================= */

'use strict';

/* ---------------------------------------------------------
   1. Trigram data (Fu Xi / 先天 order, 1–8)
   Each trigram: lines from bottom to top (1=yang, 0=yin)
   --------------------------------------------------------- */
const TRIGRAMS = {
  1: { name: '乾', sym: '☰', pinyin: 'Qian', nature: '天', elem: '金', desc: '剛健中正，自強不息，主宰之象。' },
  2: { name: '兌', sym: '☱', pinyin: 'Dui',  nature: '澤', elem: '金', desc: '喜悅和潤，言談口舌，朋友講習。' },
  3: { name: '離', sym: '☲', pinyin: 'Li',   nature: '火', elem: '火', desc: '光明附麗，文采明察，中虛外明。' },
  4: { name: '震', sym: '☳', pinyin: 'Zhen', nature: '雷', elem: '木', desc: '動而奮起，雷聲震驚，長男之象。' },
  5: { name: '巽', sym: '☴', pinyin: 'Xun',  nature: '風', elem: '木', desc: '順而入物，風行無阻，長女之象。' },
  6: { name: '坎', sym: '☵', pinyin: 'Kan',  nature: '水', elem: '水', desc: '陷而多險，水流不息，中男之象。' },
  7: { name: '艮', sym: '☶', pinyin: 'Gen',  nature: '山', elem: '土', desc: '止而不動，安固如山，少男之象。' },
  8: { name: '坤', sym: '☷', pinyin: 'Kun',  nature: '地', elem: '土', desc: '柔順厚載，承天時行，萬物之母。' },
};

// Five-element generation / control
// 生: 金→水→木→火→土→金 ; 克: 金→木→土→水→火→金
const ELEM_GEN = { '金': '水', '水': '木', '木': '火', '火': '土', '土': '金' };
const ELEM_CTRL = { '金': '木', '木': '土', '土': '水', '水': '火', '火': '金' };
const ELEM_NAME = { '金': '金', '水': '水', '木': '木', '火': '火', '土': '土' };

/* ---------------------------------------------------------
   2. Hexagram lookup: (upperTrigramNum, lowerTrigramNum) → King Wen #1–64
   --------------------------------------------------------- */
const HEX_LOOKUP = [
  // index 0 unused; rows = upper trigram, cols = lower trigram (1..8)
  //        0  1乾 2兌 3離 4震 5巽 6坎 7艮 8坤
  /* 0 */ [ 0,  0,  0,  0,  0,  0,  0,  0,  0 ],
  /* 1乾 */ [ 0,  1, 10, 13, 25, 44,  6, 33, 12 ],
  /* 2兌 */ [ 0, 43, 58, 49, 17, 28, 47, 31, 45 ],
  /* 3離 */ [ 0, 14, 38, 30, 21, 50, 64, 56, 35 ],
  /* 4震 */ [ 0, 34, 54, 55, 51, 32, 40, 62, 16 ],
  /* 5巽 */ [ 0,  9, 61, 37, 42, 57, 59, 53, 20 ],
  /* 6坎 */ [ 0,  5, 60, 63,  3, 48, 29, 39,  8 ],
  /* 7艮 */ [ 0, 26, 41, 22, 27, 18,  4, 52, 23 ],
  /* 8坤 */ [ 0, 11, 19, 36, 24, 46,  7, 15,  2 ],
];

/* ---------------------------------------------------------
   3. The 64 Hexagrams (King Wen order)
   Each: name, fullName, guaCi (judgment), xiang (image), yaoCi[6] (line texts, bottom→top)
   --------------------------------------------------------- */
const HEXAGRAMS = {
  1:  { name: '乾', full: '乾為天',     ci: '元亨利貞。',                 xiang: '天行健，君子以自強不息。',         yao: ['潛龍勿用。','見龍在田，利見大人。','君子終日乾乾，夕惕若厲，無咎。','或躍在淵，無咎。','飛龍在天，利見大人。','亢龍有悔。'] },
  2:  { name: '坤', full: '坤為地',     ci: '元亨，利牝馬之貞。',         xiang: '地勢坤，君子以厚德載物。',         yao: ['履霜，堅冰至。','直方大，不習無不利。','含章可貞。','括囊，無咎無譽。','黃裳，元吉。','龍戰于野，其血玄黃。'] },
  3:  { name: '屯', full: '水雷屯',     ci: '元亨利貞，勿用有攸往，利建侯。', xiang: '雲雷屯，君子以經綸。',           yao: ['磐桓，利居貞，利建侯。','屯如邅如，乘馬班如。','即鹿無虞，惟入于林中。','乘馬班如，求婚媾。','屯其膏，小貞吉，大貞凶。','乘馬班如，泣血漣如。'] },
  4:  { name: '蒙', full: '山水蒙',     ci: '亨。匪我求童蒙，童蒙求我。', xiang: '山下出泉，蒙，君子以果行育德。',   yao: ['發蒙，利用刑人。','包蒙吉。納婦吉，子克家。','勿用取女。','困蒙，吝。','童蒙，吉。','擊蒙，不利為寇，利禦寇。'] },
  5:  { name: '需', full: '水天需',     ci: '有孚，光亨，貞吉，利涉大川。', xiang: '雲上于天，需，君子以飲食宴樂。',   yao: ['需于郊，利用恆，無咎。','需于沙，小有言，終吉。','需于泥，致寇至。','需于血，出自穴。','需于酒食，貞吉。','入于穴，有不速之客三人來。'] },
  6:  { name: '訟', full: '天水訟',     ci: '有孚窒惕，中吉終凶。利見大人。', xiang: '天與水違行，訟，君子以作事謀始。', yao: ['不永所事，小有言，終吉。','不克訟，歸而逋。','食舊德，貞厲，終吉。','不克訟，復即命，渝，安貞吉。','訟，元吉。','或錫之鞶帶，終朝三褫之。'] },
  7:  { name: '師', full: '地水師',     ci: '貞，丈人吉，無咎。',         xiang: '地中有水，師，君子以容民畜眾。',   yao: ['師出以律，否臧凶。','在師中，吉，無咎。','師或輿尸，凶。','師左次，無咎。','田有禽，利執言，無咎。','大君有命，開國承家，小人勿用。'] },
  8:  { name: '比', full: '水地比',     ci: '吉。原筮元永貞，無咎。',     xiang: '地上有水，比，先王以建萬國，親諸侯。', yao: ['有孚比之，無咎。','比之自內，貞吉。','比之匪人。','外比之，貞吉。','顯比，王用三驅。','比之無首，凶。'] },
  9:  { name: '小畜', full: '風天小畜', ci: '亨。密雲不雨，自我西郊。',   xiang: '風行天上，小畜，君子以懿文德。',   yao: ['復自道，何其咎，吉。','牽復，吉。','輿說輻，夫妻反目。','有孚，血去惕出，無咎。','有孚攣如，富以其鄰。','既雨既處，尚德載。'] },
  10: { name: '履', full: '天澤履',     ci: '履虎尾，不咥人，亨。',       xiang: '上天下澤，履，君子以辯上下，定民志。', yao: ['素履往，無咎。','履道坦坦，幽人貞吉。','眇能視，跛能履，履虎尾咥人，凶。','履虎尾，愬愬終吉。','夬履，貞厲。','視履考祥，其旋元吉。'] },
  11: { name: '泰', full: '地天泰',     ci: '小往大來，吉亨。',           xiang: '天地交，泰，后以財成天地之道。',   yao: ['拔茅茹，以其彙，征吉。','包荒，用馮河。','無平不陂，無往不復。','翩翩，不富以其鄰。','帝乙歸妹，以祉元吉。','城復于隍，勿用師。'] },
  12: { name: '否', full: '天地否',     ci: '否之匪人，不利君子貞。',     xiang: '天地不交，否，君子以儉德辟難。',   yao: ['拔茅茹，以其彙，貞吉，亨。','包承，小人吉，大人否。','包羞。','有命無咎，疇離祉。','休否，大人吉。','傾否，先否後喜。'] },
  13: { name: '同人', full: '天火同人', ci: '同人于野，亨。利涉大川。',   xiang: '天與火，同人，君子以類族辨物。',   yao: ['同人于門，無咎。','同人于宗，吝。','伏戎于莽，升其高陵。','乘其墉，弗克攻，吉。','同人，先號咷而後笑。','同人于郊，無悔。'] },
  14: { name: '大有', full: '火天大有', ci: '元亨。',                     xiang: '火在天上，大有，君子以遏惡揚善。', yao: ['無交害，匪咎，艱則無咎。','大車以載，有攸往，無咎。','公用亨于天子，小人弗克。','匪其彭，無咎。','厥孚交如，威如，吉。','自天佑之，吉無不利。'] },
  15: { name: '謙', full: '地山謙',     ci: '亨，君子有終。',             xiang: '地中有山，謙，君子以裒多益寡。',   yao: ['謙謙君子，用涉大川，吉。','鳴謙，貞吉。','勞謙，君子有終，吉。','無不利，撝謙。','不富以其鄰，利用侵伐。','鳴謙，利用行師征邑國。'] },
  16: { name: '豫', full: '雷地豫',     ci: '利建侯行師。',               xiang: '雷出地奮，豫，先王以作樂崇德。',   yao: ['鳴豫，凶。','介于石，不終日，貞吉。','盱豫，悔，遲有悔。','由豫，大有得，勿疑。','貞疾，恆不死。','冥豫，成有渝，無咎。'] },
  17: { name: '隨', full: '澤雷隨',     ci: '元亨利貞，無咎。',           xiang: '澤中有雷，隨，君子以嚮晦入宴息。', yao: ['官有渝，貞吉，出門交有功。','係小子，失丈夫。','係丈夫，失小子。','隨有獲，貞凶。','孚于嘉，吉。','拘係之，乃從維之，王用亨于西山。'] },
  18: { name: '蠱', full: '山風蠱',     ci: '元亨，利涉大川。先甲三日，後甲三日。', xiang: '山下有風，蠱，君子以振民育德。', yao: ['幹父之蠱，有子，考無咎。','幹母之蠱，不可貞。','幹父之蠱，小有悔，無大咎。','裕父之蠱，往見吝。','幹父之蠱，用譽。','不事王侯，高尚其事。'] },
  19: { name: '臨', full: '地澤臨',     ci: '元亨利貞。至于八月有凶。',   xiang: '澤上有地，臨，君子以教思無窮。',   yao: ['咸臨，貞吉。','咸臨，吉，無不利。','甘臨，無攸利。','至臨，無咎。','知臨，大君之宜，吉。','敦臨，吉，無咎。'] },
  20: { name: '觀', full: '風地觀',     ci: '盥而不薦，有孚顒若。',       xiang: '風行地上，觀，先王以省方觀民設教。', yao: ['初六，童觀，小人無咎，君子吝。','窺觀，利女貞。','觀我生，進退。','觀國之光，利用賓于王。','觀我生，君子無咎。','觀其生，君子無咎。'] },
  21: { name: '噬嗑', full: '火雷噬嗑', ci: '亨，利用獄。',               xiang: '雷電噬嗑，先王以明罰敕法。',       yao: ['履校滅趾，無咎。','噬膚滅鼻，無咎。','噬腊肉，遇毒，小吝，無咎。','噬乾胏，得金矢，利艱貞吉。','噬乾肉，得黃金，貞厲，無咎。','何校滅耳，凶。'] },
  22: { name: '賁', full: '山火賁',     ci: '亨，小利有攸往。',           xiang: '山下有火，賁，君子以明庶政，無敢折獄。', yao: ['賁其趾，舍車而徒。','賁其須。','賁如濡如，永貞吉。','賁如皤如，白馬翰如。','賁于丘園，束帛戔戔，吝，終吉。','白賁，無咎。'] },
  23: { name: '剝', full: '山地剝',     ci: '不利有攸往。',               xiang: '山附于地，剝，上以厚下安宅。',     yao: ['剝床以足，蔑貞凶。','剝床以辨，蔑貞凶。','剝之，無咎。','剝床以膚，凶。','貫魚，以宮人寵，無不利。','碩果不食，君子得輿，小人剝廬。'] },
  24: { name: '復', full: '地雷復',     ci: '亨。出入無疾，朋來無咎。',   xiang: '雷在地中，復，先王以至日閉關。',   yao: ['不遠復，無祇悔，元吉。','休復，吉。','頻復，厲，無咎。','中行獨復。','敦復，無悔。','迷復，凶，有災眚。'] },
  25: { name: '無妄', full: '天雷無妄', ci: '元亨利貞。其匪正有眚。',     xiang: '天下雷行，物與無妄，先王以茂對時育萬物。', yao: ['無妄，往吉。','不耕穫，不菑畬，則利有攸往。','無妄之災，或繫之牛，行人之得，邑人之災。','可貞，無咎。','無妄之疾，勿藥有喜。','無妄行，有眚，無攸利。'] },
  26: { name: '大畜', full: '山天大畜', ci: '利貞，不家食吉，利涉大川。', xiang: '天在山中，大畜，君子以多識前言往行，以畜其德。', yao: ['有厲，利已。','輿說輹。','良馬逐，利艱貞。','童牛之牿，元吉。','豶豕之牙，吉。','何天之衢，亨。'] },
  27: { name: '頤', full: '山雷頤',     ci: '貞吉。觀頤，自求口實。',     xiang: '山下有雷，頤，君子以慎言語，節飲食。', yao: ['舍爾靈龜，觀我朵頤，凶。','顛頤，拂經于丘頤，征凶。','拂頤，貞凶。','顛頤吉，虎視眈眈，其欲逐逐，無咎。','拂經，居貞吉，不可涉大川。','由頤，厲吉，利涉大川。'] },
  28: { name: '大過', full: '澤風大過', ci: '棟橈，利有攸往，亨。',       xiang: '澤滅木，大過，君子以獨立不懼，遯世無悶。', yao: ['藉用白茅，無咎。','枯楊生稊，老夫得其女妻，無不利。','棟橈，凶。','棟隆，吉，有它吝。','枯楊生華，老婦得其士夫，無咎無譽。','過涉滅頂，凶，無咎。'] },
  29: { name: '坎', full: '坎為水',     ci: '習坎，有孚，維心亨，行有尚。', xiang: '水洊至，習坎，君子以常德行，習教事。', yao: ['習坎，入于坎窞，凶。','坎有險，求小得。','來之坎坎，險且枕，入于坎窞，勿用。','樽酒簋貳，用缶，納約自牖，終無咎。','坎不盈，祗既平，無咎。','係用徽纆，寘于叢棘，三歲不得，凶。'] },
  30: { name: '離', full: '離為火',     ci: '利貞，亨。畜牝牛吉。',       xiang: '明兩作，離，大人以繼明照于四方。', yao: ['履錯然，敬之，無咎。','黃離，元吉。','日昃之離，不鼓缶而歌，則大耋之嗟，凶。','突如其來如，焚如，死如，棄如。','出涕沱若，戚嗟若，吉。','王用出征，有嘉折首，獲匪其醜，無咎。'] },
  31: { name: '咸', full: '澤山咸',     ci: '亨，利貞，取女吉。',         xiang: '山上有澤，咸，君子以虛受人。',     yao: ['咸其拇。','咸其腓，凶，居吉。','咸其股，執其隨，往吝。','貞吉悔亡，憧憧往來，朋從爾思。','咸其脢，無悔。','咸其輔頰舌。'] },
  32: { name: '恆', full: '雷風恆',     ci: '亨，無咎，利貞，利有攸往。', xiang: '雷風，恆，君子以立不易方。',       yao: ['浚恆，貞凶，無攸利。','悔亡。','不恆其德，或承之羞，貞吝。','田無禽。','恆其德，貞，婦人吉，夫子凶。','振恆，凶。'] },
  33: { name: '遯', full: '天山遯',     ci: '亨，小利貞。',               xiang: '天下有山，遯，君子以遠小人，不惡而嚴。', yao: ['遯尾，厲，勿用有攸往。','執之用黃牛之革，莫之勝說。','係遯，有疾厲，畜臣妾吉。','好遯，君子吉，小人否。','嘉遯，貞吉。','肥遯，無不利。'] },
  34: { name: '大壯', full: '雷天大壯', ci: '利貞。',                     xiang: '雷在天上，大壯，君子以非禮弗履。', yao: ['壯于趾，征凶，有孚。','貞吉。','小人用壯，君子用罔，貞厲。','貞吉悔亡，藩決不羸，壯于大輿之輹。','喪羊于易，無悔。','羝羊觸藩，不能退，不能遂，無攸利。'] },
  35: { name: '晉', full: '火地晉',     ci: '康侯用錫馬蕃庶，晝日三接。', xiang: '明出地上，晉，君子以自昭明德。',   yao: ['晉如摧如，貞吉，罔孚，裕無咎。','晉如愁如，貞吉，受茲介福，于其王母。','眾允，悔亡。','晉如鼫鼠，貞厲。','悔亡，失得勿恤，往吉無不利。','晉其角，維用伐邑，厲吉無咎，貞吝。'] },
  36: { name: '明夷', full: '地火明夷', ci: '利艱貞。',                   xiang: '明入地中，明夷，君子以蒞眾，用晦而明。', yao: ['明夷于飛，垂其翼。君子于行，三日不食。','明夷，夷于左股，用拯馬壯，吉。','明夷于南狩，得其大首，不可疾貞。','入于左腹，獲明夷之心，于出門庭。','箕子之明夷，利貞。','不明晦，初登于天，後入于地。'] },
  37: { name: '家人', full: '風火家人', ci: '利女貞。',                   xiang: '風自火出，家人，君子以言有物而行有恆。', yao: ['閑有家，悔亡。','無攸遂，在中饋，貞吉。','家人嗃嗃，悔厲吉。婦子嘻嘻，終吝。','富家，大吉。','王假有家，勿恤吉。','有孚威如，終吉。'] },
  38: { name: '睽', full: '火澤睽',     ci: '小事吉。',                   xiang: '上火下澤，睽，君子以同而異。',     yao: ['悔亡，喪馬勿逐，自復。','遇主于巷，無咎。','見輿曳，其牛掣，其人天且劓，無初有終。','睽孤，遇元夫，交孚，厲無咎。','悔亡，厥宗噬膚，往何咎。','睽孤，見豕負塗，載鬼一車，先張之弧，後說之弧。'] },
  39: { name: '蹇', full: '水山蹇',     ci: '利西南，不利東北。利見大人。', xiang: '山上有水，蹇，君子以反身修德。',   yao: ['往蹇來譽。','王臣蹇蹇，匪躬之故。','往蹇來反。','往蹇來連。','大蹇朋來。','往蹇來碩，吉，利見大人。'] },
  40: { name: '解', full: '雷水解',     ci: '利西南，無所往，其來復吉。', xiang: '雷雨作，解，君子以赦過宥罪。',     yao: ['無咎。','田獲三狐，得黃矢，貞吉。','負且乘，致寇至，貞吝。','解而拇，朋至斯孚。','君子維有解，吉，有孚于小人。','公用射隼于高墉之上，獲之，無不利。'] },
  41: { name: '損', full: '山澤損',     ci: '有孚，元吉，無咎，可貞。',   xiang: '山下有澤，損，君子以懲忿窒欲。',   yao: ['已事遄往，無咎，酌損之。','利貞，征凶，弗損益之。','三人行則損一人，一人行則得其友。','損其疾，使遄有喜，無咎。','或益之十朋之龜，弗克違，元吉。','弗損益之，無咎，貞吉，利有攸往。'] },
  42: { name: '益', full: '風雷益',     ci: '利有攸往，利涉大川。',       xiang: '風雷益，君子以見善則遷，有過則改。', yao: ['利用為大作，元吉，無咎。','或益之十朋之龜，弗克違，永貞吉。','益之用凶事，無咎，有孚中行。','中行告公從，利用為依遷國。','有孚惠心，勿問元吉，有孚惠我德。','莫益之，或擊之，立心勿恆，凶。'] },
  43: { name: '夬', full: '澤天夬',     ci: '揚于王庭，孚號有厲。告自邑，不利即戎。', xiang: '澤上于天，夬，君子以施祿及下，居德則忌。', yao: ['壯于前趾，往不勝為咎。','惕號，莫夜有戎，勿恤。','壯于頄，有凶，君子夬夬，獨行遇雨，若濡有慍，無咎。','臀無膚，其行次且，牽羊悔亡，聞言不信。','莧陸夬夬，中行無咎。','無號，終有凶。'] },
  44: { name: '姤', full: '天風姤',     ci: '女壯，勿用取女。',           xiang: '天下有風，姤，后以施命誥四方。',   yao: ['繫于金柅，貞吉，有攸往，見凶。','包有魚，無咎，不利賓。','臀無膚，其行次且，厲，無大咎。','包無魚，起凶。','以杞包瓜，含章，有隕自天。','姤其角，吝，無咎。'] },
  45: { name: '萃', full: '澤地萃',     ci: '亨，王假有廟，利見大人。',   xiang: '澤上于地，萃，君子以除戎器，戒不虞。', yao: ['有孚不終，乃亂乃萃，若號，一握為笑，勿恤，往無咎。','引吉，無咎，孚乃利用禴。','萃如嗟如，無攸利，往無咎，小吝。','大吉無咎。','萃有位，無咎，匪孚，元永貞，悔亡。','齎咨涕洟，無咎。'] },
  46: { name: '升', full: '地風升',     ci: '元亨，用見大人，勿恤，南征吉。', xiang: '地中生木，升，君子以順德，積小以高大。', yao: ['允升，大吉。','孚乃利用禴，無咎。','升虛邑。','王用亨于岐山，吉，無咎。','貞吉，升階。','冥升，利于不息之貞。'] },
  47: { name: '困', full: '澤水困',     ci: '亨，貞，大人吉，無咎。有言不信。', xiang: '澤無水，困，君子以致命遂志。',   yao: ['臀困于株木，入于幽谷，三歲不覿。','困于酒食，朱紱方來，利用享祀，征凶，無咎。','困于石，據于蒺藜，入于其宮，不見其妻，凶。','來徐徐，困于金車，吝，有終。','劓刖，困于赤紱，乃徐有說，利用祭祀。','困于葛藟，于臲卼，曰動悔，有悔，征吉。'] },
  48: { name: '井', full: '水風井',     ci: '改邑不改井，無喪無得。',     xiang: '木上有水，井，君子以勞民勸相。',   yao: ['井泥不食，舊井無禽。','井谷射鮒，甕敝漏。','井渫不食，為我心惻，可用汲。','井甃，無咎。','井洌寒泉食。','井收勿幕，有孚元吉。'] },
  49: { name: '革', full: '澤火革',     ci: '己日乃孚，元亨利貞，悔亡。', xiang: '澤中有火，革，君子以治曆明時。',   yao: ['鞏用黃牛之革。','己日乃革之，征吉，無咎。','征凶，貞厲，革言三就，有孚。','悔亡，有孚改命，吉。','大人虎變，未占有孚。','君子豹變，小人革面，征凶，居貞吉。'] },
  50: { name: '鼎', full: '火風鼎',     ci: '元吉，亨。',                 xiang: '木上有火，鼎，君子以正位凝命。',   yao: ['鼎顛趾，利出否，得妾以其子，無咎。','鼎有實，我仇有疾，不我能即，吉。','鼎耳革，其行塞，雉膏不食，方雨虧悔，終吉。','鼎折足，覆公餗，其形渥，凶。','鼎黃耳金鉉，利貞。','鼎玉鉉，大吉，無不利。'] },
  51: { name: '震', full: '震為雷',     ci: '亨。震來虩虩，笑言啞啞。',   xiang: '洊雷震，君子以恐懼修省。',         yao: ['震來虩虩，後笑言啞啞，吉。','震來厲，億喪貝，躋于九陵，勿逐，七日得。','震蘇蘇，震行無眚。','震遂泥。','震往來厲，億無喪，有事。','震索索，視矍矍，征凶。'] },
  52: { name: '艮', full: '艮為山',     ci: '艮其背，不獲其身，行其庭，不見其人，無咎。', xiang: '兼山艮，君子以思不出其位。', yao: ['艮其趾，無咎，利永貞。','艮其腓，不拯其隨，其心不快。','艮其限，列其夤，厲薰心。','艮其身，無咎。','艮其輔，言有序，悔亡。','敦艮，吉。'] },
  53: { name: '漸', full: '風山漸',     ci: '女歸吉，利貞。',             xiang: '山上有木，漸，君子以居賢德善俗。', yao: ['鴻漸于干，小子厲，有言，無咎。','鴻漸于磐，飲食衎衎，吉。','鴻漸于陸，夫征不復，婦孕不育，凶，利禦寇。','鴻漸于木，或得其桷，無咎。','鴻漸于陵，婦三歲不孕，終莫之勝，吉。','鴻漸于陸，其羽可用為儀，吉。'] },
  54: { name: '歸妹', full: '雷澤歸妹', ci: '征凶，無攸利。',             xiang: '澤上有雷，歸妹，君子以永終知敝。', yao: ['歸妹以娣，跛能履，征吉。','眇能視，利幽人之貞。','歸妹以須，反歸以娣。','歸妹愆期，遲歸有時。','帝乙歸妹，其君之袂，不如其娣之袂良。','女承筐無實，士刲羊無血，無攸利。'] },
  55: { name: '豐', full: '雷火豐',     ci: '亨，王假之，勿憂，宜日中。', xiang: '雷電皆至，豐，君子以折獄致刑。',   yao: ['遇其配主，雖旬無咎，往有尚。','豐其蔀，日中見斗，往得疑疾，有孚發若，吉。','豐其沛，日中見沬，折其右肱，無咎。','豐其蔀，日中見斗，遇其夷主，吉。','來章，有慶譽，吉。','豐其屋，蔀其家，窺其戶，闃其無人，三歲不覿，凶。'] },
  56: { name: '旅', full: '火山旅',     ci: '小亨，旅貞吉。',             xiang: '山上有火，旅，君子以明慎用刑而不留獄。', yao: ['旅瑣瑣，斯其所取災。','旅即次，懷其資，得童僕貞。','旅焚其次，喪其童僕，貞厲。','旅于處，得其資斧，我心不快。','射雉一矢亡，終以譽命。','鳥焚其巢，旅人先笑後號咷，喪牛于易，凶。'] },
  57: { name: '巽', full: '巽為風',     ci: '小亨，利有攸往，利見大人。', xiang: '隨風巽，君子以申命行事。',         yao: ['進退，利武人之貞。','巽在床下，用史巫紛若，吉，無咎。','頻巽，吝。','悔亡，田獲三品。','貞吉悔亡，無不利，無初有終。','巽在床下，喪其資斧，貞凶。'] },
  58: { name: '兌', full: '兌為澤',     ci: '亨，利貞。',                 xiang: '麗澤兌，君子以朋友講習。',         yao: ['和兌，吉。','孚兌，吉，悔亡。','來兌，凶。','商兌未寧，介疾有喜。','孚于剝，有厲。','引兌。'] },
  59: { name: '渙', full: '風水渙',     ci: '亨，王假有廟，利涉大川，利貞。', xiang: '風行水上，渙，先王以享于帝立廟。', yao: ['用拯馬壯，吉。','渙奔其機，悔亡。','渙其躬，無悔。','渙其群，元吉，渙有丘，匪夷所思。','渙汗其大號，渙王居，無咎。','渙其血，去逖出，無咎。'] },
  60: { name: '節', full: '水澤節',     ci: '亨，苦節不可貞。',           xiang: '澤上有水，節，君子以制數度，議德行。', yao: ['不出戶庭，無咎。','不出門庭，凶。','不節若，則嗟若，無咎。','安節，亨。','甘節，吉，往有尚。','苦節，貞凶，悔亡。'] },
  61: { name: '中孚', full: '風澤中孚', ci: '豚魚吉，利涉大川，利貞。',   xiang: '澤上有風，中孚，君子以議獄緩死。', yao: ['虞吉，有它不燕。','鳴鶴在陰，其子和之，我有好爵，吾與爾靡之。','得敵，或鼓或罷，或泣或歌。','月幾望，馬匹亡，無咎。','有孚攣如，無咎。','翰音登于天，貞凶。'] },
  62: { name: '小過', full: '雷山小過', ci: '亨，利貞，可小事，不可大事。', xiang: '山上有雷，小過，君子以行過乎恭，喪過乎哀，用過乎儉。', yao: ['飛鳥以凶。','過其祖，遇其妣，不及其君，遇其臣，無咎。','弗過防之，從或戕之，凶。','無咎，弗過遇之，往厲必戒，勿用永貞。','密雲不雨，自我西郊，公弋取彼在穴。','弗遇過之，飛鳥離之，凶，是謂災眚。'] },
  63: { name: '既濟', full: '水火既濟', ci: '亨小，利貞，初吉終亂。',     xiang: '水在火上，既濟，君子以思患而豫防之。', yao: ['曳其輪，濡其尾，無咎。','婦喪其茀，勿逐，七日得。','高宗伐鬼方，三年克之，小人勿用。','繻有衣袽，終日戒。','東鄰殺牛，不如西鄰之禴祭，實受其福。','濡其首，厲。'] },
  64: { name: '未濟', full: '火水未濟', ci: '亨，小狐汔濟，濡其尾，無攸利。', xiang: '火在水上，未濟，君子以慎辨物居方。', yao: ['濡其尾，吝。','曳其輪，貞吉。','未濟，征凶，利涉大川。','貞吉悔亡，震用伐鬼方，三年有賞于大國。','貞吉無悔，君子之光，有孚吉。','有孚于飲酒，無咎，濡其首，有孚失是。'] },
};

/* ---------------------------------------------------------
   4. Core engine
   --------------------------------------------------------- */

// Trigram lines as array [bottom, mid, top] of 0/1 (1=yang, 0=yin)
function trigramLines(num) {
  switch (num) {
    case 1: return [1,1,1]; // 乾
    case 2: return [1,1,0]; // 兌
    case 3: return [1,0,1]; // 離
    case 4: return [1,0,0]; // 震
    case 5: return [0,1,1]; // 巽
    case 6: return [0,1,0]; // 坎
    case 7: return [0,0,1]; // 艮
    case 8: return [0,0,0]; // 坤
    default: return [0,0,0];
  }
}

// Build 6-line array (bottom→top) from upper & lower trigram nums
function hexLines(upperNum, lowerNum) {
  const lower = trigramLines(lowerNum); // lines 1,2,3 (bottom)
  const upper = trigramLines(upperNum); // lines 4,5,6 (top)
  return lower.concat(upper); // [l1,l2,l3,l4,l5,l6]
}

// King Wen hexagram number from upper/lower trigram
function hexNumber(upperNum, lowerNum) {
  return HEX_LOOKUP[upperNum][lowerNum];
}

// Mutual hexagram (互卦): from original 6 lines,
// 互下 = lines 2,3,4 (1-indexed) → new lower trigram
// 互上 = lines 3,4,5 (1-indexed) → new upper trigram
function mutualTrigrams(lines) {
  // lines is 0-indexed array of 6
  const huLowerLines = [lines[1], lines[2], lines[3]];
  const huUpperLines = [lines[2], lines[3], lines[4]];
  return { upper: trigramNumFromLines(huUpperLines), lower: trigramNumFromLines(huLowerLines) };
}

// Inverse of trigramLines: given [bottom,mid,top], return 1..8
function trigramNumFromLines(arr) {
  const [b, m, t] = arr;
  // build binary key bottom→top
  const key = `${b}${m}${t}`;
  const map = {
    '111': 1, '110': 2, '101': 3, '100': 4,
    '011': 5, '010': 6, '001': 7, '000': 8,
  };
  return map[key];
}

// Change the moving line (1-indexed, 1..6) → returns new hexagram lines
function changedLines(lines, movingYao) {
  const out = lines.slice();
  out[movingYao - 1] = out[movingYao - 1] === 1 ? 0 : 1;
  return out;
}

// Determine 體/用 from moving yao position
// If moving yao in lower trigram (1..3), 體 = upper trigram, 用 = lower trigram (of original)
// If moving yao in upper trigram (4..6), 體 = lower trigram, 用 = upper trigram
function tiYong(upperNum, lowerNum, movingYao) {
  if (movingYao <= 3) {
    return { ti: upperNum, yong: lowerNum };
  }
  return { ti: lowerNum, yong: upperNum };
}

// Five-element relationship between 體 and 用
function elementRelation(tiElem, yongElem) {
  if (tiElem === yongElem) {
    return { type: 'bihé', label: '比和', verdict: '體用同氣，相扶相助，事多順遂，中吉之象。', auspicious: 'mid' };
  }
  if (ELEM_GEN[yongElem] === tiElem) {
    return { type: 'yongShengTi', label: '用生體', verdict: '用生體，如母育子，外援自來，大吉之象。', auspicious: 'high' };
  }
  if (ELEM_GEN[tiElem] === yongElem) {
    return { type: 'tiShengYong', label: '體生用', verdict: '體生用，元氣外泄，事雖成而力耗，小凶之象。', auspicious: 'low' };
  }
  if (ELEM_CTRL[yongElem] === tiElem) {
    return { type: 'yongKeTi', label: '用剋體', verdict: '用剋體，外力相逼，阻礙重重，大凶之象，宜守不宜進。', auspicious: 'bad' };
  }
  if (ELEM_CTRL[tiElem] === yongElem) {
    return { type: 'tiKeYong', label: '體剋用', verdict: '體剋用，我制於外，勞而可獲，小凶中藏吉，勉力則成。', auspicious: 'low-mid' };
  }
  return { type: 'unknown', label: '—', verdict: '—', auspicious: 'mid' };
}

// Compute a full reading from upper/lower trigram + moving yao
function buildReading(upperNum, lowerNum, movingYao) {
  const lines = hexLines(upperNum, lowerNum);
  const benNum = hexNumber(upperNum, lowerNum);
  const ben = HEXAGRAMS[benNum];

  // Mutual
  const huTri = mutualTrigrams(lines);
  const huNum = hexNumber(huTri.upper, huTri.lower);
  const hu = HEXAGRAMS[huNum];

  // Changed
  const newLines = changedLines(lines, movingYao);
  const bianUpper = trigramNumFromLines(newLines.slice(3, 6));
  const bianLower = trigramNumFromLines(newLines.slice(0, 3));
  const bianNum = hexNumber(bianUpper, bianLower);
  const bian = HEXAGRAMS[bianNum];

  // Ti / Yong
  const { ti, yong } = tiYong(upperNum, lowerNum, movingYao);
  const tiTri = TRIGRAMS[ti];
  const yongTri = TRIGRAMS[yong];
  const rel = elementRelation(tiTri.elem, yongTri.elem);

  // Moving yao text (1-indexed)
  const yaoText = ben.yao[movingYao - 1];

  return {
    upper: upperNum, lower: lowerNum, moving: movingYao,
    lines, benNum, ben, huNum, hu, bianNum, bian,
    ti, yong, tiTri, yongTri, rel, yaoText,
  };
}

/* ---------------------------------------------------------
   5. Number → trigram (mod 8, with 0 → 8)
   --------------------------------------------------------- */
function numToTrigram(n) {
  const r = ((n % 8) + 8) % 8;
  return r === 0 ? 8 : r;
}
function sumToYao(n) {
  const r = ((n % 6) + 6) % 6;
  return r === 0 ? 6 : r;
}

/* ---------------------------------------------------------
   6. Time-based casting
   Year branch: (year - 3) mod 12, 0 → 12
   Upper = (year + month + day) mod 8 (0 → 8)
   Lower = (year + month + day + hour) mod 8 (0 → 8)
   Moving yao = (year + month + day + hour) mod 6 (0 → 6)
   --------------------------------------------------------- */
function castByTime(year, month, day, hourBranch) {
  const yb = ((year - 3) % 12 + 12) % 12 || 12;
  const sumUpper = yb + month + day;
  const sumLower = sumUpper + hourBranch;
  const upper = numToTrigram(sumUpper);
  const lower = numToTrigram(sumLower);
  const yao = sumToYao(sumLower);
  return buildReading(upper, lower, yao);
}

/* ---------------------------------------------------------
   7. Number-based casting
   Upper = upperNum mod 8 (0 → 8)
   Lower = (upperNum + lowerNum) mod 8 (0 → 8)
   Moving yao = (upperNum + lowerNum) mod 6 (0 → 6)
   (classic 梅花 method)
   --------------------------------------------------------- */
function castByNumber(a, b) {
  const upper = numToTrigram(a);
  const lower = numToTrigram(a + b);
  const yao = sumToYao(a + b);
  return buildReading(upper, lower, yao);
}

/* ---------------------------------------------------------
   8. Word-based casting
   Single char: stroke = charCode % 64 (approx), upper = stroke % 8,
     lower = (stroke + hour) % 8, yao = (stroke + hour) % 6
   Two chars: upper = strokeA % 8, lower = strokeB % 8,
     yao = (strokeA + strokeB + hour) % 6
   Multi (3-4): sum all strokes as upper, count as lower, etc.
   --------------------------------------------------------- */
function charStroke(ch) {
  // Approximate stroke count via Unicode code point, folded into a reasonable range.
  const cp = ch.codePointAt(0) || 1;
  return (cp % 30) + 1; // 1..30
}

function castByWord(text, hourBranch) {
  const chars = [...text].filter(c => c.trim().length > 0);
  if (chars.length === 0) return null;
  if (chars.length === 1) {
    const s = charStroke(chars[0]);
    const upper = numToTrigram(s);
    const lower = numToTrigram(s + hourBranch);
    const yao = sumToYao(s + hourBranch);
    return buildReading(upper, lower, yao);
  }
  if (chars.length === 2) {
    const a = charStroke(chars[0]);
    const b = charStroke(chars[1]);
    const upper = numToTrigram(a);
    const lower = numToTrigram(b);
    const yao = sumToYao(a + b + hourBranch);
    return buildReading(upper, lower, yao);
  }
  // 3+ chars: sum strokes → upper; count → lower; + hour → yao
  const sum = chars.reduce((acc, c) => acc + charStroke(c), 0);
  const upper = numToTrigram(sum);
  const lower = numToTrigram(chars.length);
  const yao = sumToYao(sum + hourBranch);
  return buildReading(upper, lower, yao);
}

/* ---------------------------------------------------------
   9. Random casting — uses crypto if available
   --------------------------------------------------------- */
function castByRandom() {
  const a = secureRandom(1, 99);
  const b = secureRandom(1, 99);
  return castByNumber(a, b);
}
function secureRandom(min, max) {
  const range = max - min + 1;
  if (window.crypto && crypto.getRandomValues) {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return min + (buf[0] % range);
  }
  return min + Math.floor(Math.random() * range);
}

/* ---------------------------------------------------------
   10. Synthesis text generator
   --------------------------------------------------------- */
const OMENS = {
  high: [
    '雲開見月，事有轉機。',
    '東風解凍，萬象更新。',
    '枯木逢春，遲開亦芳。',
    '舟行順水，帆滿風輕。',
  ],
  mid: [
    '行至中途，宜審宜緩。',
    '月有盈虧，事有起伏。',
    '雲散風停，可徐圖之。',
    '半開半合，以待天時。',
  ],
  low: [
    '逆水行舟，宜守不宜進。',
    '霧重路迷，且待天明。',
    '花未全開，且忍一時。',
    '風起萍末，慎防微漸。',
  ],
  'low-mid': [
    '勞而有獲，不可懈怠。',
    '耕耘在前，收穫在後。',
    '事多周折，勉力則成。',
    '險中求安，慎之則吉。',
  ],
  bad: [
    '雷電交加，宜避其鋒。',
    '風雨飄搖，守身為上。',
    '暗流潛伏，不可輕動。',
    '霧鎖前路，退守為安。',
  ],
};

function buildSynthesis(reading) {
  const { ben, hu, bian, tiTri, yongTri, rel, moving, benNum, bianNum } = reading;
  const ausp = rel.auspicious;

  // Overall fortune map
  const fortuneMap = {
    high: '大吉',
    mid: '中吉',
    low: '小凶',
    'low-mid': '小凶中吉',
    bad: '大凶',
  };

  const lines = [];
  lines.push(`<p>本卦得 <b>${ben.full}</b>（第${benNum}卦），其象為「${ben.ci}」。卦意${describeHexagram(benNum)}。</p>`);
  lines.push(`<p>互卦 <b>${hu.full}</b>，揭示其間隱而未顯之勢，乃事之樞紐所在；變卦 <b>${bian.full}</b>，為事之歸宿、變化之極。</p>`);
  lines.push(`<p>動在第 <b>${moving}</b> 爻，體為 <b>${tiTri.name}（${tiTri.elem}）</b>，用為 <b>${yongTri.name}（${yongTri.elem}）</b>，二者${rel.label}。${rel.verdict}</p>`);
  lines.push(`<p>綜而觀之：${overallAdvice(ben, bian, ausp)}。此卦總體趨向 <b class="fortune fortune--${ausp}">${fortuneMap[ausp]}</b>。</p>`);

  const omenPool = OMENS[ausp] || OMENS.mid;
  const omen = omenPool[Math.floor(Math.random() * omenPool.length)];

  return { text: lines.join(''), omen };
}

function describeHexagram(num) {
  // Light one-line gloss per hexagram cluster — keep concise
  const gloss = {
    1:'主剛健進取', 2:'主柔順承載', 3:'主初生艱難', 4:'主蒙昧待啟',
    5:'主等待時機', 6:'主爭訟不和', 7:'主聚眾用兵', 8:'主親附團結',
    9:'主小有積聚', 10:'主履險慎行', 11:'主天地交泰', 12:'主閉塞不通',
    13:'主和同協力', 14:'主大有所得', 15:'主謙虛受益', 16:'主安樂奮起',
    17:'主隨順時勢', 18:'主整治積弊', 19:'主陽氣漸臨', 20:'主觀仰省察',
    21:'主剛決明斷', 22:'主文飾修飾', 23:'主剝落衰微', 24:'主一陽來復',
    25:'主順乎自然', 26:'主大為蓄積', 27:'主頤養正道', 28:'主負重過載',
    29:'主重險陷溺', 30:'主附麗光明', 31:'主交感相應', 32:'主恆久守常',
    33:'主退避隱遁', 34:'主陽剛強盛', 35:'主晉升明達', 36:'主明傷晦藏',
    37:'主家道正肅', 38:'主乖違異途', 39:'主蹇難行險', 40:'主解除困厄',
    41:'主減損奉公', 42:'主增益遷善', 43:'主決斷去除', 44:'主不期而遇',
    45:'主聚集薈萃', 46:'主上升積進', 47:'主困窮受困', 48:'主養人不竭',
    49:'主變革除舊', 50:'主鼎新調理', 51:'主震動驚懼', 52:'主安止不動',
    53:'主循序漸進', 54:'主歸嫁失正', 55:'主盛大豐滿', 56:'主行旅在外',
    57:'主順從滲透', 58:'主喜悅和悅', 59:'主渙散離散', 60:'主節制有度',
    61:'主誠信中實', 62:'主小有過越', 63:'主既成已定', 64:'主未成將成',
  };
  return gloss[num] || '主變化之道';
}

function overallAdvice(ben, bian, ausp) {
  const advice = {
    high: `本卦既吉，變卦亦順，宜順勢而為，乘機而進，勿失良時`,
    mid: `本卦平穩，宜守中道，徐圖緩進，不急不躁，自然有成`,
    low: `本卦微有阻滯，宜收斂鋒芒，靜候時變，不可強求`,
    'low-mid': `卦象勞而有成，須付心力，方可收功，宜堅忍不怠`,
    bad: `卦象兇險，宜止不宜行，守正待時，避其鋒芒為上`,
  };
  return advice[ausp] || advice.mid;
}

/* ---------------------------------------------------------
   10b. AI Oracle — 智者详解
   --------------------------------------------------------- */
const AI_CONFIG_KEY = 'momei-ai-config';

const AI_PROVIDERS = [
  {
    id: 'openai',
    name: 'OpenAI',
    short: 'GPT',
    icon: 'G',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    modelsEndpoint: 'https://api.openai.com/v1/models',
    defaultModel: 'gpt-4o-mini',
    keyPrefixes: ['sk-', 'sk-proj-'],
  },
  {
    id: 'deepseek',
    name: '深度求索',
    short: 'DeepSeek',
    icon: 'D',
    endpoint: 'https://api.deepseek.com/v1/chat/completions',
    modelsEndpoint: 'https://api.deepseek.com/v1/models',
    defaultModel: 'deepseek-chat',
    keyPrefixes: ['sk-'],
  },
  {
    id: 'moonshot',
    name: '月之暗面',
    short: 'Kimi',
    icon: 'K',
    endpoint: 'https://api.moonshot.cn/v1/chat/completions',
    modelsEndpoint: 'https://api.moonshot.cn/v1/models',
    defaultModel: 'moonshot-v1-8k',
    keyPrefixes: ['sk-'],
  },
  {
    id: 'zhipu',
    name: '智譜清言',
    short: '智譜',
    icon: '智',
    endpoint: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    modelsEndpoint: 'https://open.bigmodel.cn/api/paas/v4/models',
    defaultModel: 'glm-4-flash',
    keyPrefixes: ['', 'eyJ'],
  },
  {
    id: 'qwen',
    name: '通義千問',
    short: '通義',
    icon: '通',
    endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    modelsEndpoint: null,
    defaultModel: 'qwen-turbo',
    keyPrefixes: ['sk-'],
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    short: 'Claude',
    icon: 'C',
    endpoint: 'https://api.anthropic.com/v1/messages',
    modelsEndpoint: null,
    defaultModel: 'claude-3-haiku-20240307',
    keyPrefixes: ['sk-ant-'],
    anthropic: true,
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    short: '聚合',
    icon: '聚',
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    modelsEndpoint: 'https://openrouter.ai/api/v1/models',
    defaultModel: 'openai/gpt-4o-mini',
    keyPrefixes: ['sk-or-v1-', 'sk-or-', 'sk-'],
  },
  {
    id: 'siliconflow',
    name: '硅基流動',
    short: '硅基',
    icon: '硅',
    endpoint: 'https://api.siliconflow.cn/v1/chat/completions',
    modelsEndpoint: 'https://api.siliconflow.cn/v1/models',
    defaultModel: 'Qwen/Qwen2.5-7B-Instruct',
    keyPrefixes: ['sk-'],
  },
];

function detectProviderByKey(key) {
  if (!key) return null;

  // Check more specific prefixes first (longer prefix = more specific)
  const candidates = [];
  for (const p of AI_PROVIDERS) {
    for (const prefix of p.keyPrefixes || []) {
      if (prefix && key.startsWith(prefix)) {
        candidates.push({ p, len: prefix.length });
      }
    }
  }
  if (candidates.length === 0) return null;
  // Longest matching prefix wins
  candidates.sort((a, b) => b.len - a.len);
  return candidates[0].p;
}

function providerById(id) {
  return AI_PROVIDERS.find(p => p.id === id);
}

function getAIConfig() {
  try {
    const raw = localStorage.getItem(AI_CONFIG_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return { endpoint: '', key: '', model: '' };
}

function saveAIConfig(cfg) {
  try {
    localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(cfg));
  } catch (e) {}
}

function hasAIConfig() {
  const c = getAIConfig();
  return !!(c.endpoint && c.key);
}

// Build a rich prompt for the AI
function buildAIPrompt(reading, question) {
  const { ben, hu, bian, tiTri, yongTri, rel, moving, yaoText, benNum, huNum, bianNum, upper, lower } = reading;
  const huTri = mutualTrigrams(reading.lines);

  const q = question && question.trim() ? question.trim() : '未有具體所問，泛觀此卦大勢。';

  const system = `你是一位精通《周易》與梅花易數的國學智者，人稱「墨梅先生」。
你以文言與白話交融的筆調解卦，語氣從容溫和，藏鋒於柔。
解卦時請遵循：
1. 先言卦象大義（本卦、互卦、變卦之內在聯繫）
2. 再析體用五行生剋，定吉凶趨勢
3. 參以動爻爻辭，具體而微
4. 最後給出貼身的建議
請用繁體中文，分段書寫，每段以精煉古雅的短句開頭。
忌機械條列，宜如對坐而談。`;

  const user = `【所問之事】
${q}

【卦象】
本卦：${ben.full}（第${benNum}卦）· 卦辭：${ben.ci}
· 上卦：${TRIGRAMS[upper].name}（${TRIGRAMS[upper].nature}，五行屬${TRIGRAMS[upper].elem}）
· 下卦：${TRIGRAMS[lower].name}（${TRIGRAMS[lower].nature}，五行屬${TRIGRAMS[lower].elem}）

互卦：${hu.full}（第${huNum}卦）
· 上卦：${TRIGRAMS[huTri.upper].name}（${TRIGRAMS[huTri.upper].nature}）
· 下卦：${TRIGRAMS[huTri.lower].name}（${TRIGRAMS[huTri.lower].nature}）

變卦：${bian.full}（第${bianNum}卦）· 卦辭：${bian.ci}

【動爻】
第${moving}爻（${yaoNameFor(moving, reading.lines[moving-1]===1)}）動
爻辭：${yaoText}

【體用五行】
體卦：${tiTri.name}（${tiTri.nature}，${tiTri.elem}）
用卦：${yongTri.name}（${yongTri.nature}，${yongTri.elem}）
關係：${rel.label}——${rel.verdict}

請據此為占者詳解此卦。`;

  return { system, user };
}

// Call AI (OpenAI-compatible or Anthropic)
async function callAI(reading, question, onProgress) {
  const cfg = getAIConfig();
  const { system, user } = buildAIPrompt(reading, question);

  const model = cfg.model || 'gpt-4o-mini';
  const isAnthropic = cfg.endpoint.includes('anthropic.com') ||
    (cfg.providerId && providerById(cfg.providerId)?.anthropic);

  if (isAnthropic) {
    return callAnthropic(cfg, model, system, user, onProgress);
  }
  return callOpenAICompatible(cfg, model, system, user, onProgress);
}

async function callOpenAICompatible(cfg, model, system, user, onProgress) {
  const resp = await fetch(cfg.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${cfg.key}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.75,
      stream: true,
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text().catch(() => '');
    throw new Error(`API 調用失敗（${resp.status}）：${errText.slice(0, 120) || resp.statusText}`);
  }

  // Stream parsing for SSE
  const reader = resp.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      if (!trimmed.startsWith('data:')) continue;
      const data = trimmed.slice(5).trim();
      if (data === '[DONE]') continue;
      try {
        const obj = JSON.parse(data);
        const delta = obj.choices?.[0]?.delta?.content;
        if (delta) {
          fullText += delta;
          if (onProgress) onProgress(fullText);
        }
      } catch (e) {
        // Skip malformed chunks
      }
    }
  }

  // Fallback for non-streaming responses
  if (!fullText) {
    try {
      // re-parse from start (we already consumed stream, but some APIs return JSON)
      // Try full response body from buffer
      const leftover = buffer.trim();
      if (leftover) {
        const obj = JSON.parse(leftover);
        fullText = obj.choices?.[0]?.message?.content || obj.content || '';
        if (onProgress && fullText) onProgress(fullText);
      }
    } catch (e) {}
  }

  return fullText;
}

async function callAnthropic(cfg, model, system, user, onProgress) {
  const resp = await fetch(cfg.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': cfg.key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      system,
      max_tokens: 2048,
      messages: [{ role: 'user', content: user }],
      stream: true,
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text().catch(() => '');
    throw new Error(`API 調用失敗（${resp.status}）：${errText.slice(0, 120) || resp.statusText}`);
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      if (!trimmed.startsWith('data:')) continue;
      const data = trimmed.slice(5).trim();
      if (!data) continue;
      try {
        const obj = JSON.parse(data);
        if (obj.type === 'content_block_delta') {
          const delta = obj.delta?.text;
          if (delta) {
            fullText += delta;
            if (onProgress) onProgress(fullText);
          }
        }
      } catch (e) {}
    }
  }

  return fullText;
}

// Enhanced fallback analysis (when no API configured)
function buildFallbackAnalysis(reading, question) {
  const { ben, hu, bian, tiTri, yongTri, rel, moving, yaoText, benNum } = reading;
  const q = question && question.trim() ? `「${question.trim()}」` : '所問之事';

  const ausp = rel.auspicious;
  const fortuneWord = {
    high: '吉', mid: '平', low: '小凶', 'low-mid': '凶中藏吉', bad: '凶',
  }[ausp];

  const paragraphs = [];

  paragraphs.push(`<p><em>卦有大象。</em>本卦得 <strong>${ben.full}</strong>（第${benNum}卦），${describeHexagram(benNum)}。卦辭云「${ben.ci}」，此乃事之當下面目也。</p>`);

  paragraphs.push(`<p><em>互見其裡。</em>互卦 <strong>${hu.full}</strong>，事之隱情、中間之曲折也；變卦 <strong>${bian.full}</strong>，事之最終歸向也。由本而互、而變，如行路人，自起點歷中途而至終點，其勢連貫，不可割裂觀之。</p>`);

  paragraphs.push(`<p><em>體用定勢。</em>體為 <strong>${tiTri.name}（${tiTri.elem}）</strong>，用為 <strong>${yongTri.name}（${yongTri.elem}）</strong>，二者<strong>${rel.label}</strong>。${rel.verdict}大體言之，此卦<strong class="fortune fortune--${ausp}">屬${fortuneWord}</strong>。</p>`);

  paragraphs.push(`<p><em>動爻示機。</em>動在第${moving}爻，其辭曰「${yaoText}」。此乃全卦之關鍵、吉凶之樞紐。動則變，變則通，君子觀動爻而知進退。</p>`);

  if (q !== '所問之事') {
    paragraphs.push(`<p><em>就事而論。</em>以${q}視之，${specificAdvice(reading, ausp)}。</p>`);
  }

  paragraphs.push(`<p><em>智者建言。</em>${wisdomByAuspicious(ausp)}。卦以象告，辭以文言，吉凶悔吝，生乎動者也。占者觀其象、玩其辭、審其動，則思過半矣。</p>`);

  return paragraphs.join('\n');
}

function specificAdvice(reading, ausp) {
  const { ben, moving, tiTri } = reading;
  const templates = {
    high: [
      `此卦於所問之事，正當順勢而為之時，如舟順流而下，不費力而自進`,
      `所問之事，時機已熟，乘勢而行，必有可觀之獲`,
      `此象於所問大有裨益，貴在把握當下，勿使良機錯過`,
    ],
    mid: [
      `所問之事，宜守中道，不急不徐，徐圖緩進，自有成時`,
      `於此一事，平穩為上，不宜急進，亦不宜退縮，靜待時變可也`,
      `事之成敗，端在於心。守正持中，則雖平亦安`,
    ],
    low: [
      `所問之事，須費心力方可有成，不可坐待，宜主動經營`,
      `此事須多所付出，而後能有所得。勞而有獲，亦不失為吉`,
      `事有小阻，然非不可為。勉力為之，終有所得`,
    ],
    'low-mid': [
      `所問之事，勞而可成，惟須持之以恆，不可半途而廢`,
      `此事須步步為營，穩紮穩打，急則生變，緩則可成`,
      `凶中藏吉，轉機在於堅忍。只要方向不錯，終有到達之日`,
    ],
    bad: [
      `所問之事，當下實非良機，宜暫緩之，退守待時，不可強求`,
      `此事凶多吉少，勸君三思。暫且收斂，保全實力，以圖後舉`,
      `當此之時，止為上策。靜以養心，待時而動，方為智者之選`,
    ],
  };
  const pool = templates[ausp] || templates.mid;
  return pool[Math.floor(Math.random() * pool.length)];
}

function wisdomByAuspicious(ausp) {
  const w = {
    high: '天行健，君子以自強不息。當順勢而上，更進一層',
    mid: '君子居易以俟命，不疾不徐，自得其宜',
    low: '勞謙君子，有終吉。付出與收穫，終歸相稱',
    'low-mid': '山重水復疑無路，柳暗花明又一村。堅持，便有轉機',
    bad: '尺蠖之屈，以求信也。龍蛇之蟄，以存身也。退守，亦是前行',
  };
  return w[ausp] || w.mid;
}

/* ---------------------------------------------------------
   11. Rendering
   --------------------------------------------------------- */
function renderHexagram(container, lines, movingYao) {
  container.innerHTML = '';
  // Render top → bottom (line 6 first), so we prepend
  for (let i = 6; i >= 1; i--) {
    const isYang = lines[i - 1] === 1;
    const isMoving = i === movingYao;
    const yao = document.createElement('div');
    yao.className = 'yao' + (isYang ? ' yao--yang' : ' yao--yin') + (isMoving ? ' yao--moving' : '');
    const idx = document.createElement('span');
    idx.className = 'yao__index';
    idx.textContent = toChineseNum(i); // line position 1..6
    const seg1 = document.createElement('span');
    seg1.className = 'yao__seg';
    yao.appendChild(idx);
    yao.appendChild(seg1);
    if (!isYang) {
      const seg2 = document.createElement('span');
      seg2.className = 'yao__seg';
      yao.appendChild(seg2);
    }
    container.appendChild(yao);
  }
}

function toChineseNum(n) {
  return ['','初','二','三','四','五','上'][n] || n;
}

function renderReading(reading) {
  currentReading = reading;
  // Hexagrams
  renderHexagram(document.getElementById('draw-ben'),  reading.lines, reading.moving);
  // Mutual: re-derive its trigram numbers from the original lines (no moving yao on 互卦)
  const huTri = mutualTrigrams(reading.lines);
  renderHexagram(document.getElementById('draw-hu'), hexLines(huTri.upper, huTri.lower), 0);

  const bianLines = changedLines(reading.lines, reading.moving);
  renderHexagram(document.getElementById('draw-bian'), bianLines, 0);

  // Names & ci
  document.getElementById('name-ben').textContent  = `${reading.ben.full}　第${reading.benNum}卦`;
  document.getElementById('ci-ben').textContent    = reading.ben.ci;
  document.getElementById('name-hu').textContent   = `${reading.hu.full}　第${reading.huNum}卦`;
  document.getElementById('ci-hu').textContent     = reading.hu.ci;
  document.getElementById('name-bian').textContent = `${reading.bian.full}　第${reading.bianNum}卦`;
  document.getElementById('ci-bian').textContent   = reading.bian.ci;

  // Ti / Yong
  document.getElementById('ti-name').textContent  = `${reading.tiTri.name}（${reading.tiTri.nature}）`;
  document.getElementById('ti-elem').textContent  = `五行：${reading.tiTri.elem}`;
  document.getElementById('yong-name').textContent = `${reading.yongTri.name}（${reading.yongTri.nature}）`;
  document.getElementById('yong-elem').textContent = `五行：${reading.yongTri.elem}`;
  document.getElementById('ti-relation').textContent = reading.rel.label;
  document.getElementById('ti-verdict').textContent = reading.rel.verdict;

  // Yao
  const yaoName = yaoNameFor(reading.moving, reading.lines[reading.moving - 1] === 1);
  document.getElementById('yao-line').textContent = `第 ${toChineseNum(reading.moving)} 爻動（${yaoName}）`;
  document.getElementById('yao-text').textContent = reading.yaoText;

  // Synthesis
  const synth = buildSynthesis(reading);
  document.getElementById('synthesis-body').innerHTML = synth.text;
  document.getElementById('omen-text').textContent = synth.omen;

  // Reveal
  const result = document.getElementById('result');
  result.hidden = false;
  result.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function yaoNameFor(pos, isYang) {
  // Standard: 九 for yang, 六 for yin; e.g. 初九, 六二, 九五, 上九
  const cn = toChineseNum(pos);
  if (pos === 1) return isYang ? '初九' : '初六';
  if (pos === 6) return isYang ? '上九' : '上六';
  return isYang ? `九${cn}` : `六${cn}`;
}

/* ---------------------------------------------------------
   12. UI wiring
   --------------------------------------------------------- */
const state = { method: 'time', ready: false };

document.addEventListener('DOMContentLoaded', () => {
  initPetals();
  initBaguaAtlas();
  initTabs();
  initInputs();
  initCastButton();
  initRandomOracle();
  initRecastButton();
  initOracle();
  // Pre-fill time fields with current time
  fillCurrentTime();
});

/* --- Petals --- */
function initPetals() {
  const root = document.getElementById('petals');
  const count = 18;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('span');
    p.className = 'petals__petal';
    const left = Math.random() * 100;
    const delay = Math.random() * 18;
    const dur = 14 + Math.random() * 14;
    const drift = (Math.random() - 0.5) * 200;
    const scale = 0.6 + Math.random() * 0.9;
    p.style.left = left + 'vw';
    p.style.animationDelay = -delay + 's';
    p.style.animationDuration = dur + 's';
    p.style.setProperty('--drift', drift + 'px');
    p.style.transform = `rotate(45deg) scale(${scale})`;
    root.appendChild(p);
  }
}

/* --- Bagua atlas --- */
function initBaguaAtlas() {
  const ring = document.getElementById('bagua-ring');
  const order = [1, 2, 3, 4, 5, 6, 7, 8]; // Fuxi order
  for (const n of order) {
    const t = TRIGRAMS[n];
    const cell = document.createElement('div');
    cell.className = 'bagua-cell';
    cell.innerHTML = `
      <div class="bagua-cell__symbol">${t.sym}</div>
      <div class="bagua-cell__name">${t.name}</div>
      <div class="bagua-cell__pinyin">${t.pinyin}</div>
      <div class="bagua-cell__nature">為${t.nature} · 五行${t.elem}</div>
      <div class="bagua-cell__desc">${t.desc}</div>
    `;
    ring.appendChild(cell);
  }
}

/* --- Method tabs --- */
function initTabs() {
  const tabs = document.querySelectorAll('.method-tab');
  const panels = document.querySelectorAll('.input-panel');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const method = tab.dataset.method;
      state.method = method;
      tabs.forEach(t => t.classList.toggle('is-active', t === tab));
      panels.forEach(p => p.classList.toggle('is-active', p.dataset.panel === method));
      // For 'random', the cast button is replaced by the oracle core click.
      updateCastReadiness();
      setStatus('已選「' + tab.querySelector('.method-tab__cn').textContent + '」之法，請設其數。');
    });
  });
}

/* --- Inputs --- */
function initInputs() {
  const yearIn  = document.getElementById('in-year');
  const monthIn = document.getElementById('in-month');
  const dayIn   = document.getElementById('in-day');
  const hourIn  = document.getElementById('in-hour');
  const numU    = document.getElementById('num-upper');
  const numL    = document.getElementById('num-lower');
  const wordIn  = document.getElementById('word-input');

  [yearIn, monthIn, dayIn, hourIn].forEach(el => el.addEventListener('input', () => {
    updateHints();
    updateCastReadiness();
  }));

  [numU, numL].forEach(el => el.addEventListener('input', updateCastReadiness));
  wordIn.addEventListener('input', updateCastReadiness);

  document.getElementById('btn-now').addEventListener('click', () => {
    fillCurrentTime();
    updateHints();
    updateCastReadiness();
    setStatus('已取當下時辰，可起卦矣。');
  });
}

function fillCurrentTime() {
  const now = new Date();
  document.getElementById('in-year').value  = now.getFullYear();
  document.getElementById('in-month').value = now.getMonth() + 1;
  document.getElementById('in-day').value   = now.getDate();
  // Hour branch
  const h = now.getHours();
  // 23–1 → 子(1); each branch spans 2 hours starting at 23
  let branch;
  if (h === 23 || h === 0) branch = 1;
  else branch = Math.floor((h + 1) / 2) + 1;
  document.getElementById('in-hour').value = branch;
  updateHints();
}

function updateHints() {
  const y = parseInt(document.getElementById('in-year').value, 10);
  if (y) {
    const yb = ((y - 3) % 12 + 12) % 12 || 12;
    const branches = ['','子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
    const zodiacs  = ['','鼠','牛','虎','兔','龍','蛇','馬','羊','猴','雞','狗','豬'];
    document.getElementById('hint-year').textContent = `${branches[yb]}年 · 屬${zodiacs[yb]}`;
  } else {
    document.getElementById('hint-year').textContent = '—';
  }
  const m = parseInt(document.getElementById('in-month').value, 10);
  document.getElementById('hint-month').textContent = m ? `${m} 月` : '—';
  const d = parseInt(document.getElementById('in-day').value, 10);
  document.getElementById('hint-day').textContent = d ? `${d} 日` : '—';
  const hr = parseInt(document.getElementById('in-hour').value, 10);
  document.getElementById('hint-hour').textContent = hr ? `第 ${hr} 支` : '—';
}

/* --- Cast readiness --- */
function updateCastReadiness() {
  const btn = document.getElementById('cast-btn');
  let ready = false;
  if (state.method === 'time') {
    const y = parseInt(document.getElementById('in-year').value, 10);
    const m = parseInt(document.getElementById('in-month').value, 10);
    const d = parseInt(document.getElementById('in-day').value, 10);
    const h = parseInt(document.getElementById('in-hour').value, 10);
    ready = !!(y && m && d && h);
  } else if (state.method === 'number') {
    const a = parseInt(document.getElementById('num-upper').value, 10);
    const b = parseInt(document.getElementById('num-lower').value, 10);
    ready = !!(a && b);
  } else if (state.method === 'word') {
    ready = document.getElementById('word-input').value.trim().length > 0;
  } else if (state.method === 'random') {
    ready = true;
  }
  state.ready = ready;
  btn.disabled = !ready;
}

/* --- Cast button --- */
function initCastButton() {
  const btn = document.getElementById('cast-btn');
  btn.addEventListener('click', () => {
    if (!state.ready) return;
    performCast();
  });
}

function performCast() {
  const btn = document.getElementById('cast-btn');
  btn.classList.add('is-casting');
  setStatus('凝神運數，象由心生……');

  setTimeout(() => {
    let reading = null;
    try {
      if (state.method === 'time') {
        const y = parseInt(document.getElementById('in-year').value, 10);
        const m = parseInt(document.getElementById('in-month').value, 10);
        const d = parseInt(document.getElementById('in-day').value, 10);
        const h = parseInt(document.getElementById('in-hour').value, 10);
        reading = castByTime(y, m, d, h);
      } else if (state.method === 'number') {
        const a = parseInt(document.getElementById('num-upper').value, 10);
        const b = parseInt(document.getElementById('num-lower').value, 10);
        reading = castByNumber(a, b);
      } else if (state.method === 'word') {
        const text = document.getElementById('word-input').value.trim();
        const h = parseInt(document.getElementById('in-hour').value, 10) || currentHourBranch();
        reading = castByWord(text, h);
      } else if (state.method === 'random') {
        reading = castByRandom();
      }
    } catch (err) {
      console.error(err);
      setStatus('起卦有誤，請重試。', true);
      btn.classList.remove('is-casting');
      return;
    }

    btn.classList.remove('is-casting');
    if (!reading) {
      setStatus('所設之數未備，未能成卦。', true);
      return;
    }
    setStatus('卦已起，象已成，請觀下文。');
    renderReading(reading);
  }, 900);
}

function currentHourBranch() {
  const h = new Date().getHours();
  if (h === 23 || h === 0) return 1;
  return Math.floor((h + 1) / 2) + 1;
}

/* --- Random oracle --- */
function initRandomOracle() {
  const core = document.getElementById('random-core');
  core.addEventListener('click', () => {
    core.classList.add('is-casting');
    setStatus('天機自落，數從心生……');
    setTimeout(() => {
      const reading = castByRandom();
      core.classList.remove('is-casting');
      setStatus('一念既起，卦象已成。');
      renderReading(reading);
    }, 900);
  });
}

/* --- Recast --- */
function initRecastButton() {
  document.getElementById('recast-btn').addEventListener('click', () => {
    document.getElementById('result').hidden = true;
    document.getElementById('divination').scrollIntoView({ behavior: 'smooth', block: 'start' });
    setStatus('再起一卦，心念重凝。');
  });
}

/* --- AI Oracle --- */
let currentReading = null;
let selectedProviderId = null;

function initOracle() {
  const configBtn = document.getElementById('oracle-config-btn');
  const configPanel = document.getElementById('oracle-config');
  const saveBtn = document.getElementById('config-save');
  const testBtn = document.getElementById('config-test');
  const endpointInput = document.getElementById('api-endpoint');
  const keyInput = document.getElementById('api-key');
  const modelInput = document.getElementById('api-model');
  const modelSelect = document.getElementById('api-model-select');
  const modelRefreshBtn = document.getElementById('model-refresh');
  const oracleBtn = document.getElementById('oracle-btn');
  const configStatus = document.getElementById('config-status');

  // Config tabs
  document.querySelectorAll('.config-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.ctab;
      document.querySelectorAll('.config-tab').forEach(t => t.classList.toggle('is-active', t === tab));
      document.querySelectorAll('.config-panel').forEach(p => p.classList.toggle('is-active', p.dataset.cpanel === target));
    });
  });

  // Build provider grid
  const grid = document.getElementById('provider-grid');
  AI_PROVIDERS.forEach(p => {
    const card = document.createElement('div');
    card.className = 'provider-card';
    card.dataset.provider = p.id;
    card.innerHTML = `
      <div class="provider-card__icon">${p.icon}</div>
      <div class="provider-card__name">${p.name}</div>
      <div class="provider-card__model">${p.short}</div>
    `;
    card.addEventListener('click', () => selectProvider(p.id));
    grid.appendChild(card);
  });

  function selectProvider(id) {
    selectedProviderId = id;
    const p = providerById(id);
    document.querySelectorAll('.provider-card').forEach(c => {
      c.classList.toggle('is-selected', c.dataset.provider === id);
    });
    if (p) {
      endpointInput.value = p.endpoint;
      if (!modelInput.value || modelInput.value === '') {
        modelInput.value = p.defaultModel;
      }
      // Auto-switch to custom tab to show key input
      // Actually keep user on preset, just fill in custom fields silently
      setConfigStatus(`已選擇「${p.name}」，請輸入 API 密鑰`);
    }
  }

  function setConfigStatus(msg, type) {
    configStatus.textContent = msg;
    configStatus.classList.toggle('is-success', type === 'success');
    configStatus.classList.toggle('is-error', type === 'error');
  }

  // Auto-detect provider when typing key
  keyInput.addEventListener('input', () => {
    const key = keyInput.value.trim();
    const detected = detectProviderByKey(key);
    if (detected && selectedProviderId !== detected.id) {
      selectProvider(detected.id);
      setConfigStatus(`自動識別為「${detected.name}」`, 'success');
    }
  });

  // Load saved config
  const saved = getAIConfig();
  if (saved.endpoint) endpointInput.value = saved.endpoint;
  if (saved.key) keyInput.value = saved.key;
  if (saved.model) modelInput.value = saved.model;
  if (saved.providerId) {
    selectProvider(saved.providerId);
  }

  // Config toggle
  configBtn.addEventListener('click', () => {
    configPanel.hidden = !configPanel.hidden;
  });

  // Save config
  saveBtn.addEventListener('click', () => {
    const cfg = {
      endpoint: endpointInput.value.trim(),
      key: keyInput.value.trim(),
      model: modelInput.value.trim() || modelSelect.value,
      providerId: selectedProviderId,
    };
    saveAIConfig(cfg);
    saveBtn.textContent = '已保存 ✓';
    setTimeout(() => { saveBtn.textContent = '保存設置'; }, 1800);
    setConfigStatus('設置已保存', 'success');
  });

  // Test connection
  testBtn.addEventListener('click', async () => {
    testBtn.disabled = true;
    testBtn.textContent = '測試中…';
    setConfigStatus('正在測試連接…');

    try {
      const cfg = {
        endpoint: endpointInput.value.trim(),
        key: keyInput.value.trim(),
        model: modelInput.value.trim() || modelSelect.value,
      };
      const result = await testConnection(cfg);
      setConfigStatus(`連接成功 · ${result.model || '可用'}`, 'success');
      // Populate model select if we have a model list
      if (result.models && result.models.length > 0) {
        populateModelSelect(result.models, cfg.model);
      }
    } catch (err) {
      setConfigStatus('連接失敗：' + err.message.slice(0, 60), 'error');
    } finally {
      testBtn.disabled = false;
      testBtn.textContent = '測試連接';
    }
  });

  // Refresh models
  modelRefreshBtn.addEventListener('click', async () => {
    modelRefreshBtn.classList.add('is-spinning');
    try {
      const cfg = {
        endpoint: endpointInput.value.trim(),
        key: keyInput.value.trim(),
        model: modelInput.value.trim(),
      };
      const models = await fetchModels(cfg);
      populateModelSelect(models, cfg.model);
      setConfigStatus(`已載入 ${models.length} 個模型`, 'success');
    } catch (err) {
      setConfigStatus('獲取模型失敗：' + err.message.slice(0, 40), 'error');
    } finally {
      modelRefreshBtn.classList.remove('is-spinning');
    }
  });

  // When model select changes, sync to input
  modelSelect.addEventListener('change', () => {
    if (modelSelect.value) {
      modelInput.value = modelSelect.value;
    }
  });

  // Oracle button
  oracleBtn.addEventListener('click', () => runOracle());
}

async function testConnection(cfg) {
  if (!cfg.endpoint || !cfg.key) {
    throw new Error('請先填寫 API 地址與密鑰');
  }

  const model = cfg.model || 'gpt-4o-mini';
  const isAnthropic = cfg.endpoint.includes('anthropic.com');

  if (isAnthropic) {
    // Anthropic API
    const resp = await fetch(cfg.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': cfg.key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'hi' }],
      }),
    });
    if (!resp.ok) {
      const t = await resp.text().catch(() => '');
      throw new Error(`${resp.status} ${t.slice(0, 60)}`);
    }
    const data = await resp.json();
    return { model: data.model || model };
  }

  // OpenAI-compatible test
  const resp = await fetch(cfg.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${cfg.key}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: 10,
      messages: [{ role: 'user', content: 'hi' }],
    }),
  });

  if (!resp.ok) {
    const t = await resp.text().catch(() => '');
    throw new Error(`${resp.status} ${t.slice(0, 60)}`);
  }

  const data = await resp.json();
  return { model: data.model || model };
}

async function fetchModels(cfg) {
  if (!cfg.endpoint || !cfg.key) {
    throw new Error('請先填寫 API 地址與密鑰');
  }

  // Derive models endpoint from chat endpoint
  let modelsUrl;
  const chatPath = '/chat/completions';
  if (cfg.endpoint.endsWith(chatPath)) {
    modelsUrl = cfg.endpoint.slice(0, -chatPath.length) + '/models';
  } else {
    // Try to guess base URL
    const u = new URL(cfg.endpoint);
    modelsUrl = u.origin + (u.pathname.split('/').slice(0, -2).join('/') || '') + '/models';
  }

  const resp = await fetch(modelsUrl, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${cfg.key}`,
    },
  });

  if (!resp.ok) {
    throw new Error(`HTTP ${resp.status}`);
  }

  const data = await resp.json();
  const models = (data.data || []).map(m => m.id || m.model || m.name).filter(Boolean);
  return models;
}

function populateModelSelect(models, selected) {
  const sel = document.getElementById('api-model-select');
  sel.innerHTML = '<option value="">選擇模型…</option>';
  models
    .sort((a, b) => a.localeCompare(b))
    .forEach(m => {
      const opt = document.createElement('option');
      opt.value = m;
      opt.textContent = m;
      if (m === selected) opt.selected = true;
      sel.appendChild(opt);
    });
  if (selected && models.includes(selected)) {
    sel.value = selected;
  }
}

async function runOracle() {
  if (!currentReading) return;
  const btn = document.getElementById('oracle-btn');
  const output = document.getElementById('oracle-output');
  const bambooText = document.getElementById('bamboo-text');
  const question = document.getElementById('user-question').value;

  btn.classList.add('is-thinking');
  output.hidden = false;
  output.classList.add('is-thinking');
  bambooText.innerHTML = '';
  bambooText.classList.add('is-typing');

  const hasAI = hasAIConfig();

  try {
    if (hasAI) {
      await callAI(currentReading, question, (text) => {
        const formatted = formatAIOutput(text);
        bambooText.innerHTML = formatted;
        // Auto scroll
        const bamboo = document.getElementById('oracle-bamboo');
        if (bamboo.scrollHeight > bamboo.clientHeight + 100) {
          bamboo.scrollTop = bamboo.scrollHeight;
        }
      });
    } else {
      // Fallback enhanced analysis with typewriter effect
      const html = buildFallbackAnalysis(currentReading, question);
      await typewriterEffect(bambooText, html, 18);
    }
  } catch (err) {
    bambooText.innerHTML = `<p style="color: var(--vermilion-bright);">智者失語。<br/>${escapeHtml(err.message)}</p>`;
  } finally {
    btn.classList.remove('is-thinking');
    output.classList.remove('is-thinking');
    bambooText.classList.remove('is-typing');
  }
}

// Convert plain text AI response to nicely formatted HTML
function formatAIOutput(text) {
  if (!text) return '';
  let html = text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n');

  // Split into paragraphs by double newlines
  const parts = html.split('\n\n');
  const paragraphs = parts.map(p => {
    const trimmed = p.trim();
    if (!trimmed) return '';
    // Check if it looks like a list
    if (/^[-*•]/.test(trimmed)) {
      const items = trimmed.split(/\n/).filter(l => /^[-*•]/.test(l.trim()));
      return '<ul>' + items.map(item => `<li>${inlineFormat(item.replace(/^[-*•]\s*/, ''))}</li>`).join('') + '</ul>';
    }
    // Check if it's a heading (starts with 一、二、 etc or ##)
    if (/^[一二三四五六七八九十]+、/.test(trimmed) || /^##?\s+/.test(trimmed)) {
      const clean = trimmed.replace(/^##?\s+/, '');
      return `<p><strong>${inlineFormat(clean)}</strong></p>`;
    }
    return `<p>${inlineFormat(trimmed)}</p>`;
  }).filter(p => p);

  return paragraphs.join('\n');
}

function inlineFormat(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/「(.+?)」/g, '「<em>$1</em>」')
    .replace(/"/g, '"');
}

function escapeHtml(s) {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

// Typewriter for fallback HTML — reveal paragraph by paragraph
async function typewriterEffect(container, html, speed) {
  container.innerHTML = '';
  // Parse HTML into nodes
  const temp = document.createElement('div');
  temp.innerHTML = html;

  for (const node of temp.children) {
    const para = node.cloneNode(true);
    const text = para.textContent;
    para.textContent = '';
    container.appendChild(para);

    for (let i = 0; i < text.length; i++) {
      para.textContent += text[i];
      await new Promise(r => setTimeout(r, speed));
    }
    // Re-apply formatting by re-parsing the HTML of this paragraph
    para.innerHTML = inlineFormat(text);
    await new Promise(r => setTimeout(r, 120));
  }
}

/* --- Status line --- */
function setStatus(msg, isError) {
  const el = document.getElementById('status-line');
  el.textContent = msg;
  el.classList.toggle('is-error', !!isError);
  el.classList.toggle('is-ready', !isError && /已成|可起卦|已取|已選|再起/.test(msg));
}
