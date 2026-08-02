/* ============================================================
   anniversary.js — Hüseyn & Cəmalə | 3 Avqust | HƏR İL 💍
   ============================================================ */

(function () {
  "use strict";

  /* ─── KONFIQURASIYA ─────────────────────────────────────── */
  let RELATIONSHIP_START = new Date("2025-08-03T00:00:00");

  /* Hər il avtomatik: bu ilin 3 Avqustu keçibsə gələn ili al */
  function getNextAnniversaryDate() {
    let now = new Date();
    let yr = now.getFullYear();
    let candidate = new Date(yr, 7, 3, 0, 0, 0);
    if (candidate <= now) candidate = new Date(yr + 1, 7, 3, 0, 0, 0);
    return candidate;
  }

  function isAnniversaryDay() {
    let n = new Date();
    return n.getMonth() === 7 && n.getDate() === 3 &&
      n.getFullYear() >= RELATIONSHIP_START.getFullYear() + 1;
  }

  function getAnniversaryYearsCompleted() {
    let now = new Date();
    let years = now.getFullYear() - RELATIONSHIP_START.getFullYear();
    let thisYearAnniv = new Date(now.getFullYear(), 7, 3, 0, 0, 0);
    if (now < thisYearAnniv) years--;
    return Math.max(0, years);
  }

  let ANNIVERSARY_DATE = getNextAnniversaryDate();

  /* ─── 365 GÜNLÜK MESAJLAR ───────────────────────────────── */
  let DAILY_MESSAGES = [
    // 1-30: İlk ay
    "Sənin gözlərini ilk dəfə gördüyüm günü həmişə xatırlayacam. 🌟",
    "Hər günün səninlə keçməsi mənə güc verir. 💪",
    "Səninlə olmaq hər şeyi daha gözəl edir. ✨",
    "Səni düşündükcə dodaqlarımda gülüş açılır. 😊",
    "Hər səhər sənin adın ağlıma gələn ilk şeydir. 🌅",
    "Sən mənim həyatımın ən gözəl sürprizi oldun. 🎁",
    "Yanında durmaq istəyərdim — hər an, hər yerdə. 🤍",
    "Sən düşündüyümdən daha gözəl birisin. 🌸",
    "Saatlar keçir, amma sənin xatirən silinmir. ⏳",
    "Sən varlığınla mənə sevinc bəxş edirsən. 💛",
    "Adını yazdıqda belə ürəyim şad olur. 📝",
    "Hər gülüşün bir dünya dəyərindədir. 😄",
    "Səninlə keçən hər saniyə xəzinəyə bərabərdir. 💎",
    "Biz birlikdəykən dünya daha az soyuq görünür. 🔥",
    "Sənin səsin bütün musiqilərdən gözəldir. 🎵",
    "Yanında olmadığımda belə, qəlbim oradadır. 💜",
    "Səninlə paylaşılan hər an xatirəyə çevrilir. 📸",
    "Sən mənim həyatımın ən gözəl bir parçasısın. 🧩",
    "Danışmasan belə, gözlərindən hər şeyi anlayıram. 👁️",
    "Gülüşün ən uzaq günlərimi belə işıqlandırır. ☀️",
    "Sən məni hər gün özümün ən yaxşı versiyasına çevirərsən. 🌱",
    "Yanında olmaq — həyatın ən gözəl hisssidir. 🫶",
    "Sənin xoşbəxtliyin mənim xoşbəxtliiyimdir. 🌈",
    "Hər yeni gün sənlə daha möhkəmləşirik. 💪",
    "Sən mənim çox işıqlı günümsən. 🌟",
    "Səninlə olan hər şey — sevgi ilə doludur. ❤️",
    "Sən olduğun üçün həyat daha mənalıdır. 🌿",
    "Gözlərin bir dənizdir — mən həmişə oraya qayıtmaq istəyirəm. 🌊",
    "Sən bütün şeirlərimin ilhamısın. 📜",
    "Bir ay keçdi — amma sanki bir ömür keçdi. Sənlə olmaq belədir. 🕊️",
    // 31-60: İkinci ay
    "Sənlə rahat olmaq — ən böyük hədiyyədir. 🛋️",
    "Hər sükutumuz belə anlaşmadır. 🤫",
    "Sən mənim yeganə arxayınçılığımsın. ⚓",
    "Səninlə həyatın hər anı daha yüngüldür. 🪶",
    "Sən olmayanda boşluq hiss edirəm. 🌑",
    "Gülüşün dünyada ən qiymətli bir şeydir. 💰",
    "Səninlə vaxt keçirmək — hər şeydən önəmlidir. ⏰",
    "Sənin qayğın bütün yorğunluğumu aparır. 🧘",
    "Yanında olmaq ev kimi hiss etdirər. 🏠",
    "Sən mənim hər gününün anlamısın. 🎯",
    "İki ay birlikdəyik — hər günü yaşamağa dəydi. 🗓️",
    "Sən olmayan gün solğun keçər. 🌫️",
    "Hər gün sənə bir az daha bağlanıram. 🔗",
    "Səndən öyrənəcək çox şeyim var. 📚",
    "Sən mənə ümid verir, güc verirsən. 🌄",
    "Birlikdə olunan hər an — xatirənin parıltısıdır. ✨",
    "Sən yaxınlığınla dünyamı isidərsən. 🌡️",
    "Gözlərinin içinə baxanda dünyadan xəbərim olmur. 🌀",
    "Sənlə hər gün yeni bir əhvalat başlayır. 📖",
    "Ürəyimi sənə versəm bilirəm ki, qoruyacaqsan. 💝",
    "Hər mesajın günümü aydınladır. 📲",
    "Sənin xoşbəxtliyin mənə kafi. 😌",
    "Sən olmayan gecə uzun keçər. 🌙",
    "Yanında olmaq — ən gözəl sığınaq. 🛡️",
    "Sən mənim səsimin yüksəldiyi yersən. 🎤",
    "Bir baxışın min sözdən artıq deyər. 👀",
    "Sən mənim sevgi dolu dünyamsın. 🌍",
    "İki ayda nə çox şey öyrəndik bir-birimiz haqqında. 🤝",
    "Sənin sevgin ən böyük qalxandır. 🛡️",
    "Hər gün sənlə daha yaxınlaşıram. 🤗",
    // 61-90: Üçüncü ay
    "Üç ay oldu — hər gün daha dərin sevgi. 🌊",
    "Sənin hər sözün ürəyimə toxunur. 🎶",
    "Sənlə olmaq həyatın ən gözəl hissidir. 💫",
    "Səninlə paylaşılan hər xatirə — xəzinədir. 🏆",
    "Sən bütün sözlərimin ilk mənasısın. 📝",
    "Birlikdə hər şey daha asan görünür. 🌤️",
    "Sən ürəyimin ən dərin küncündə yaşayırsan. 🏡",
    "Hər çətinlikdə sənin düşüncən güc verir. 💡",
    "Sən varsan — hər şey var. 🌟",
    "Gözlərindəki işıq məni həmişə isidəcək. ☀️",
    "Sənlə olan hər an — bir qənimətdir. 🎁",
    "Sən mənim ən yaxşı dostum, sevgilim, hərşeyim. 💕",
    "Birlikdə güldüyümüz anları çox sevirəm. 😂❤️",
    "Sən varsan — dünya daha gözəl görünür. 🌺",
    "Səni düşündükcə ürəyim ısınır. 🔥",
    "Sənlə hər saniyə yaşamağa dəyər. ⏱️",
    "Sən mənim ən qiymətli xəzinəmsən. 💎",
    "Hər yeni gün səninlə daha güclüyüm. 💪",
    "Sənlə olduğumda dünya başqa görünür. 🌈",
    "Sən yalnız yanımda deyil, qəlbimdəsən. ❤️",
    "Səninlə hər çətinlik asanlaşır. 🤝",
    "Üç ay tamam oldu — hər günü yaşadım ki, özün olasan. 🌷",
    "Sən bütün gözləntilərimdən artıqsın. 🌠",
    "Yanında olmaq həmişə ilk gün kimi heyəcanlıdır. 🦋",
    "Sən məni həmişə özüm olmağa cəsarətləndirirsən. 🌱",
    "Hər gün bir az daha sənə aşiq oluram. 💘",
    "Sənin xoşbəxtliyin mənim ən böyük arzumdur. 🌟",
    "Birlikdə keçən vaxt uçub gedir — amma xatirələr qalır. 📸",
    "Sən olmayan hər gün eksikdir. 🌑",
    "Səninlə hər şey — xüsusidir. ✨",
    // 91-120: Dördüncü ay
    "Dörd ay birlikdəyik — hər gün daha da bağlanıram. 🔗",
    "Sən mənim həyatıma rəng qatdın. 🎨",
    "Yanında olmaq — ən böyük sevincdim. 😊",
    "Sənlə olmaq hər şeyi mükəmməl edir. ⭐",
    "Sən mənim səsli düşüncəmsən. 🗣️",
    "Hər anın sənlə keçsin istəyirəm. 🕰️",
    "Sən varsan — ürəyim sakit döyünür. 💓",
    "Səninlə gülmək — dünyanın ən gözəl şeyidir. 😄",
    "Sən mənim gizli gücümsün. 🦅",
    "Hər gün sənlə yeni bir şey kəşf edirəm. 🔍",
    "Səninlə keçən hər vaxt — qızıla çevrilir. 🌟",
    "Sən mənim həyatımın ən gözəl xülasəsisən. 📖",
    "Yanında olmaq hər zaman ilk günmüş kimi hiss etdirir. 🌸",
    "Sənlə olan xatirələr ürəyimi isidər həmişə. 🔥",
    "Sən mənim ən dəyərli insanımsan. 💝",
    "Birlikdə hər şey mümkündür. 🌌",
    "Sənin gülüşü dünyada ən gözəl melodiyadır. 🎼",
    "Səninlə olmaq — ömrümün ən gözəl hissəsidir. 🌹",
    "Hər gün sənlə yeni bir macəra başlayır. 🗺️",
    "Sən mənim qəlbimin ən sevimli köşəsisən. 💕",
    "Dörd ay tamam — hər gün sənlə olmağa şükür edirəm. 🙏",
    "Sən bütün şeirlərimin, hekayələrimin qəhrəmanısın. 📚",
    "Yanında olmaq istidir, xoşdur, mənalıdır. 🌼",
    "Sən mənimi tamamlayırsan. 🧩",
    "Hər çətinlikdə sən yadıma düşür, güclənirəm. 💪",
    "Sənlə gülmək, ağlamaq, danışmaq — hər şey gözəldir. 🌈",
    "Sən mənim ən yaxın insanımsan. 🤗",
    "Birlikdə olunan hər vaxt — xoşbəxtlikdir. 😊",
    "Sənin varın mənə yetər. ❤️",
    "Hər gün sənlə olmağı arzulayıram. 🌟",
    // 121-150: Beşinci ay
    "Beş ay birlikdəyik — hər günə şükür. 🌿",
    "Sən mənim ən böyük ilhamımsan. 💡",
    "Yanında olmaq həmişə yeni hiss edilir. 🦋",
    "Sənlə olmaq gözəl bir xülyaya bənzəyir. 🌙",
    "Sən mənim hər günümdə gülüş qoyursan. 😊",
    "Birlikdə güldüyümüz anlara pərəstiş edirəm. 😂",
    "Sən bütün sözlərimin ən gözəl qafiyəsisən. 📝",
    "Yanında olmağı hər şeyə dəyişmərəm. 💎",
    "Sən mənim qəlbimin işığısın. ✨",
    "Hər mesajın günümü xoş edir. 💬",
    "Sənlə keçən hər vaxt — əvəzsizdir. ⏳",
    "Sən olmayan gün rəngsiz keçər. 🎨",
    "Beş ay tamam — hər gün birlikdə böyüdük. 🌱",
    "Sənin varlığın ən böyük hədiyyədir. 🎁",
    "Yanında olmaq rahatlıqdır, sevgidir, hər şeydir. 🏡",
    "Sənlə olan xatirələr ən qiymətli şeyimdir. 📸",
    "Sən mənim ən yaxşı gününün səbəbisən. ☀️",
    "Hər gün sənlə daha möhkəmlənirəm. 🪨",
    "Sən mənim həyatımın ən gözəl nöqtəsisən. ⭐",
    "Birlikdə olunan hər an — sehrlidir. 🌟",
    "Sənlə olmaq həmişə ilk gün kimi heyəcanlıdır. 🎉",
    "Sən mənim ən dəyərli insanımsan. 💗",
    "Yanında olmaq gücdür, sevgidir, həyatdır. 🌺",
    "Hər çətinlikdə sən yadıma düşürsən. 💪",
    "Sənlə gülmək — dünyada ən gözəl şeydir. 😄",
    "Sən mənim ümidimsin, gücümsün, hər şeyim. 🕊️",
    "Beş ay keçdi — hər günü sənlə yaşadım ki, özün olasan. 🌷",
    "Sənin gülüşü hər sıxıntımı aparır. 😊",
    "Birlikdə hər şey mümkündür — həmişə. 🌈",
    "Sən mənim ən böyük xoşbəxtliyimsən. 💝",
    // 151-180: Yarım il!
    "Altı ay birlikdəyik — yarım il sevgi, yarım il xatirə! 🥂",
    "Sən mənim ən gözəl yarım ilimsən. 🌸",
    "Yanında olmaq hər saniyə daha qiymətlənir. 💎",
    "Yarım il keçdi — amma ömürlük kimi hiss edilir. 🌊",
    "Sənlə hər an — bir dünya dəyərindədir. 🌍",
    "Altı ay dolu-dolu yaşadıq — sevinclə, sevgiylə. ❤️",
    "Sən mənim həyatımın ən gözəl mərhələsisən. 🗓️",
    "Birlikdə olunan hər vaxt — xatirəyə çevrildi. 📸",
    "Sən olmasan bir şey eksikdir — həmişə. 🌑",
    "Altı ayda öyrəndim ki — sən mənim hər şeyimsən. 💫",
    "Yarım il keçdi — gəl ömrün qalan hissəsini də belə keçirək. 🌹",
    "Sən mənim ən böyük xoşbəxtliyimsən. 😊",
    "Birlikdə gülüb, danışıb, ağladıq — hər şey bizimlə gözəldi. 🌈",
    "Altı ay tamam — hər gün sənə şükür edirəm. 🙏",
    "Sənlə olmaq hər gün daha da gözəlləşir. 🌺",
    "Yanında olmaq — ən böyük mükafatdır. 🏆",
    "Sən mənim qəlbimin ən sevimli yolçususan. 🛤️",
    "Altı ay keçdi — hər biri sənlə. 💕",
    "Sən mənim həyatımın ən gözəl hissəsisən. ⭐",
    "Birlikdə hər şey — xüsusidir. ✨",
    "Sən olmayan gün tam deyil. 🌑",
    "Altı ay birlikdəyik — qoy daha çox olsun. 🕊️",
    "Sənlə keçən hər an — əbədidir qəlbimdə. 💓",
    "Sən mənim ən dəyərli insanımsan. 💗",
    "Yanında olmaq — həmişə ilk gün kimi. 🦋",
    "Altı ay tamam — hər gün bir xoşbəxtlik idi. 🌟",
    "Sənlə gülmək, ağlamaq — hər şey gözəldir. 🌷",
    "Sən mənim həyatıma nur qatdın. ☀️",
    "Birlikdə olunan hər vaxt — qızıldır. 🌟",
    "Yarım il keçdi — sən hər gün daha çox sevilirsən. ❤️🔥",
    // 181-210: Yeddinci ay
    "Yeddi ay birlikdəyik — sevgi hər gün artır. 🌊",
    "Sən mənim ən yaxın insanımsan — həmişə. 🤗",
    "Yanında olmaq — bütün dünyaya dəyər. 🌍",
    "Sənlə hər an — bir ömürlük xatirədir. 📸",
    "Yeddi ay keçdi — hər günü sənlə yaşadım ki, özün olasan. 🌿",
    "Sən mənim ən gözəl sürprizim oldun. 🎉",
    "Birlikdə olunan hər vaxt — əvəzsizdir. ⏳",
    "Sən olmayan gün solğun keçər. 🌫️",
    "Yanında olmaq rahatlıqdır, sevgidir. 🏡",
    "Yeddi ay tamam — hər gün daha da bağlanıram. 🔗",
    "Sən mənim bütün şeirlərimin qəhrəmanısın. 📚",
    "Birlikdə güldüyümüz anlara pərəstiş edirəm. 😂❤️",
    "Sən mənim ən böyük güvəncəmsən. ⚓",
    "Hər çətinlikdə sən yadıma düşürsən. 💪",
    "Sənlə olmaq — ən gözəl hisdir. 💫",
    "Yeddi ay keçdi — hər gün sənə şükür. 🙏",
    "Sən mənim qəlbimin ən sevimli köşəsisən. 💕",
    "Birlikdə hər şey mümkündür. 🌈",
    "Sən olmayan hər gün eksikdir. 🌑",
    "Yanında olmaq — ömrümün ən gözəl hissəsidir. 🌹",
    "Yeddi ay tamam — sən hər gün daha çox sevilirsən. ❤️",
    "Sən mənim ən dəyərli insanımsan. 💎",
    "Birlikdə olunan hər vaxt — xatirəyə çevrildi. 📸",
    "Sənin varlığın ən böyük hədiyyədir. 🎁",
    "Yanında olmaq — həmişə ilk gün kimi. 🦋",
    "Sənlə keçən hər vaxt — qızıla çevrilir. 🌟",
    "Yeddi ay birlikdəyik — bu yolun daha çox olmasını diləyirəm. 🛤️",
    "Sən mənim hər günümün anlamısın. 🎯",
    "Birlikdə gülmək, danışmaq — hər şey gözəldir. 🌷",
    "Sən mənim həyatımın ən gözəl nöqtəsisən. ⭐",
    // 211-240: Səkkizinci ay
    "Səkkiz ay birlikdəyik — ürəyim hər gün doluşur. 💗",
    "Sən mənim ən böyük xoşbəxtliyimsən. 😊",
    "Yanında olmaq — ən böyük mükafatdır. 🏆",
    "Sənlə olmaq hər gün daha da gözəldir. 🌺",
    "Səkkiz ay keçdi — hər günü sənlə yaşadım. 🌿",
    "Sən olmayan gün rəngsiz keçər. 🎨",
    "Birlikdə olunan hər vaxt — əbədidir. 💓",
    "Sən mənim ən yaxşı dostum, sevgilim, hər şeyim. 💕",
    "Yanında olmaq istidir, xoşdur, mənalıdır. 🌼",
    "Səkkiz ay tamam — hər gün sənə şükür edirəm. 🙏",
    "Sənlə keçən hər vaxt — əvəzsizdir. ⏳",
    "Sən mənim qəlbimin işığısın. ✨",
    "Birlikdə hər şey — xüsusidir. 🌟",
    "Sən olmayan hər gün eksikdir. 🌑",
    "Yanında olmaq — həmişə ilk gün kimi heyəcanlıdır. 🎉",
    "Səkkiz ay keçdi — sən hər gün daha çox sevilirsən. ❤️",
    "Sən mənim ən dəyərli insanımsan. 💎",
    "Birlikdə olunan hər an — sehrlidir. 🌙",
    "Sənin gülüşü dünyada ən gözəl melodiyadır. 🎼",
    "Yanında olmaq — gücdür, sevgidir, həyatdır. 🌹",
    "Səkkiz ay tamam — hər gün bir xoşbəxtlik idi. 🌟",
    "Sən mənim ümidimsin, gücümsün, hər şeyim. 🕊️",
    "Birlikdə güldüyümüz anlara pərəstiş edirəm. 😂❤️",
    "Sən mənim ən böyük güvəncəmsən. ⚓",
    "Yanında olmaq rahatlıqdır, sevgidir. 🏡",
    "Sənlə olmaq — ən gözəl hisdir. 💫",
    "Səkkiz ay birlikdəyik — bu yolun sonu yoxdur. 🛤️",
    "Sən mənim bütün şeirlərimin qəhrəmanısın. 📚",
    "Birlikdə hər şey mümkündür — həmişə. 🌈",
    "Sən mənim həyatımın ən gözəl hissəsisən. ⭐",
    // 241-270: Doqquzuncu ay
    "Doqquz ay birlikdəyik — hər gün sənlə böyüyürəm. 🌱",
    "Sən mənim ən gözəl yarım ilimsən — artıq daha çoxu. 🌸",
    "Yanında olmaq — bütün dünyaya dəyər. 🌍",
    "Sənlə hər an — bir ömürlük xatirədir. 📸",
    "Doqquz ay keçdi — hər günü sənlə yaşadım. 🌿",
    "Sən mənim ən böyük ilhamımsan. 💡",
    "Birlikdə olunan hər vaxt — əvəzsizdir. ⏳",
    "Sən olmayan gün solğun keçər. 🌫️",
    "Yanında olmaq rahatlıqdır, sevgidir, hər şeydir. 🏡",
    "Doqquz ay tamam — hər gün daha da bağlanıram. 🔗",
    "Sən mənim bütün şeirlərimin qəhrəmanısın. 📚",
    "Birlikdə güldüyümüz anlara pərəstiş edirəm. 😂❤️",
    "Sən mənim ən böyük güvəncəmsən. ⚓",
    "Hər çətinlikdə sən yadıma düşürsən. 💪",
    "Sənlə olmaq — ən gözəl hisdir. 💫",
    "Doqquz ay keçdi — hər gün sənə şükür. 🙏",
    "Sən mənim qəlbimin ən sevimli köşəsisən. 💕",
    "Birlikdə hər şey mümkündür. 🌈",
    "Sən olmayan hər gün eksikdir. 🌑",
    "Yanında olmaq — ömrümün ən gözəl hissəsidir. 🌹",
    "Doqquz ay tamam — sən hər gün daha çox sevilirsən. ❤️",
    "Sən mənim ən dəyərli insanımsan. 💎",
    "Birlikdə olunan hər vaxt — xatirəyə çevrildi. 📸",
    "Sənin varlığın ən böyük hədiyyədir. 🎁",
    "Yanında olmaq — həmişə ilk gün kimi. 🦋",
    "Sənlə keçən hər vaxt — qızıla çevrilir. 🌟",
    "Doqquz ay birlikdəyik — il tamam olmağa az qaldı. 🗓️",
    "Sən mənim hər günümün anlamısın. 🎯",
    "Birlikdə gülmək, danışmaq — hər şey gözəldir. 🌷",
    "Sən mənim həyatımın ən gözəl nöqtəsisən. ⭐",
    // 271-300: On ay
    "On ay birlikdəyik — şükür ki, sən varsan. 🙏",
    "Sən mənim ən böyük xoşbəxtliyimsən. 😊",
    "Yanında olmaq — ən böyük mükafatdır. 🏆",
    "Sənlə olmaq hər gün daha da gözəldir. 🌺",
    "On ay keçdi — hər günü sənlə yaşadım. 🌿",
    "Sən olmayan gün rəngsiz keçər. 🎨",
    "Birlikdə olunan hər vaxt — əbədidir. 💓",
    "Sən mənim ən yaxşı dostum, sevgilim, hər şeyim. 💕",
    "Yanında olmaq istidir, xoşdur, mənalıdır. 🌼",
    "On ay tamam — hər gün sənə şükür edirəm. 🙏",
    "Sənlə keçən hər vaxt — əvəzsizdir. ⏳",
    "Sən mənim qəlbimin işığısın. ✨",
    "Birlikdə hər şey — xüsusidir. 🌟",
    "Sən olmayan hər gün eksikdir. 🌑",
    "Yanında olmaq — həmişə ilk gün kimi heyəcanlıdır. 🎉",
    "On ay keçdi — sən hər gün daha çox sevilirsən. ❤️",
    "Sən mənim ən dəyərli insanımsan. 💎",
    "Birlikdə olunan hər an — sehrlidir. 🌙",
    "Sənin gülüşü dünyada ən gözəl melodiyadır. 🎼",
    "Yanında olmaq — gücdür, sevgidir, həyatdır. 🌹",
    "On ay tamam — hər gün bir xoşbəxtlik idi. 🌟",
    "Sən mənim ümidimsin, gücümsün, hər şeyim. 🕊️",
    "Birlikdə güldüyümüz anlara pərəstiş edirəm. 😂❤️",
    "Sən mənim ən böyük güvəncəmsən. ⚓",
    "Yanında olmaq rahatlıqdır, sevgidir. 🏡",
    "Sənlə olmaq — ən gözəl hisdir. 💫",
    "On ay birlikdəyik — il tamam olmağa az qaldı. 🗓️",
    "Sən mənim bütün şeirlərimin qəhrəmanısın. 📚",
    "Birlikdə hər şey mümkündür — həmişə. 🌈",
    "Sən mənim həyatımın ən gözəl hissəsisən. ⭐",
    // 301-330: On birinci ay
    "On bir ay birlikdəyik — il dönümünə az qalır! 🎊",
    "Sən mənim ən gözəl yarımımsan. 🌸",
    "Yanında olmaq — bütün dünyaya dəyər. 🌍",
    "Sənlə hər an — bir ömürlük xatirədir. 📸",
    "On bir ay keçdi — hər günü sənlə yaşadım. 🌿",
    "Sən mənim ən böyük ilhamımsan. 💡",
    "Birlikdə olunan hər vaxt — əvəzsizdir. ⏳",
    "Sən olmayan gün solğun keçər. 🌫️",
    "Yanında olmaq rahatlıqdır, sevgidir, hər şeydir. 🏡",
    "On bir ay tamam — il dönümünə sayılı günlər qalır. 🎉",
    "Sən mənim bütün şeirlərimin qəhrəmanısın. 📚",
    "Birlikdə güldüyümüz anlara pərəstiş edirəm. 😂❤️",
    "Sən mənim ən böyük güvəncəmsən. ⚓",
    "Hər çətinlikdə sən yadıma düşürsən. 💪",
    "Sənlə olmaq — ən gözəl hisdir. 💫",
    "On bir ay keçdi — hər gün sənə şükür. 🙏",
    "Sən mənim qəlbimin ən sevimli köşəsisən. 💕",
    "Birlikdə hər şey mümkündür. 🌈",
    "Sən olmayan hər gün eksikdir. 🌑",
    "Yanında olmaq — ömrümün ən gözəl hissəsidir. 🌹",
    "On bir ay tamam — sən hər gün daha çox sevilirsən. ❤️🔥",
    "Sən mənim ən dəyərli insanımsan. 💎",
    "Birlikdə olunan hər vaxt — xatirəyə çevrildi. 📸",
    "Sənin varlığın ən böyük hədiyyədir. 🎁",
    "Yanında olmaq — həmişə ilk gün kimi. 🦋",
    "Az qaldı — bir il tamam olur! Bu xoşbəxtliyi sənlə yaşayacağam. 🎊",
    "On bir ay birlikdəyik — il dönümünə hazırsanmı? 🥂",
    "Sən mənim hər günümün anlamısın. 🎯",
    "Birlikdə gülmək, danışmaq — hər şey gözəldir. 🌷",
    "Az qaldı 3 Avqusta — hər şeyim Cəmaləmə! 💖",
    // 331-364: Son ay
    "Son aydayıq — il dönümünə sayılı günlər qalır. 🎉",
    "Sən mənim ən böyük xoşbəxtliyimsən. 😊",
    "Yanında olmaq — ən böyük mükafatdır. 🏆",
    "Sənlə olmaq hər gün daha da gözəldir. 🌺",
    "Son aya girdik — hər günü sənlə yaşayacam. 🌿",
    "Sən olmayan gün rəngsiz keçər. 🎨",
    "Birlikdə olunan hər vaxt — əbədidir. 💓",
    "Sən mənim ən yaxşı dostum, sevgilim, hər şeyim. 💕",
    "Yanında olmaq istidir, xoşdur, mənalıdır. 🌼",
    "İl dönümünə yaxınlaşırıq — hazırsanmı? 🎊",
    "Sənlə keçən hər vaxt — əvəzsizdir. ⏳",
    "Sən mənim qəlbimin işığısın. ✨",
    "Birlikdə hər şey — xüsusidir. 🌟",
    "Sən olmayan hər gün eksikdir. 🌑",
    "Yanında olmaq — həmişə ilk gün kimi heyəcanlıdır. 🎉",
    "Az qaldı — il dönümünə! 🥂",
    "Sən mənim ən dəyərli insanımsan. 💎",
    "Birlikdə olunan hər an — sehrlidir. 🌙",
    "Sənin gülüşü dünyada ən gözəl melodiyadır. 🎼",
    "Yanında olmaq — gücdür, sevgidir, həyatdır. 🌹",
    "İl dönümü gəlir — sənlə bayram edəcəyim! 🎆",
    "Sən mənim ümidimsin, gücümsün, hər şeyim. 🕊️",
    "Birlikdə güldüyümüz anlara pərəstiş edirəm. 😂❤️",
    "Sən mənim ən böyük güvəncəmsən. ⚓",
    "Yanında olmaq rahatlıqdır, sevgidir. 🏡",
    "Sənlə olmaq — ən gözəl hisdir. 💫",
    "İl dönümünə bir neçə gün qaldı — ürəyim çırpınır! 🦋",
    "Sən mənim bütün şeirlərimin qəhrəmanısın. 📚",
    "Birlikdə hər şey mümkündür — həmişə. 🌈",
    "Sabah — il dönümümüzdür! Səni çox sevirəm! ❤️🔥",
    "3 Avqust... bu günü gözlədim! Bir il, min xatirə, sonsuz sevgi! 🎊",
    "Bu gün xüsusidir — ama sabah daha da xüsusidir! 🎆",
    "3 Avqust gəlir! Hazır ol — böyük sürpriz gəlir! 🎁",
    "Sabah il dönümümüzdür! Sənə ömrümü bağışlayıram! 💍",
  ];

  let ANNIVERSARY_MESSAGE_365 =
    "Bu gün... bir il tamam oldu. Hüseyn & Cəmalə — 365 gün, 8760 saat, 525,600 dəqiqə sevgi. Hər günü sənlə yaşadım, hər saniyəni sənə bağışladım. Sən mənim ən gözəl xatirəm, ən böyük sevincim, ən qiymətli insanımsan. Bir il keçdi — amma bu yolun sonu yoxdur. Sənlə ömrümün qalan hissəsini də keçirmək istəyirəm. ❤️🎉✨";

  /* ─── YARDIMÇI FUNKSİYALAR ─────────────────────────────── */
  function getDaysSinceStart() {
    return Math.floor((new Date() - RELATIONSHIP_START) / 86400000);
  }

  function getDaysUntilAnniversary() {
    let diff = ANNIVERSARY_DATE - new Date();
    if (diff <= 0) return 0;
    return {
      total: Math.floor(diff / 86400000),
      hours: Math.floor((diff % 86400000) / 3600000),
      minutes: Math.floor((diff % 3600000) / 60000),
      seconds: Math.floor((diff % 60000) / 1000),
    };
  }

  function getTodayMessage() {
    let day = getDaysSinceStart();
    if (day <= 0) return null;
    if (day >= 365) return ANNIVERSARY_MESSAGE_365;
    return DAILY_MESSAGES[Math.min(day - 1, DAILY_MESSAGES.length - 1)];
  }

  function getDayLabel() {
    let day = getDaysSinceStart();
    if (day <= 0) return "";
    let yrs = getAnniversaryYearsCompleted();
    if (isAnniversaryDay()) return yrs + ". İl Dönümü! 🎉";
    if (day >= 365) return day + "-ci Gün — " + yrs + " İl! 🎉";
    return day + "-ci Gün Birlikdə";
  }

  /* ─── İL DÖNÜMÜ SƏHİFƏSİNİ QURUR ───────────────────────── */
  function injectCountdownWidget() {
    let page = document.getElementById("page-anniversary");
    if (!page) return;
    let pc = page.querySelector(".page-content");
    if (!pc) return;

    let completed = getAnniversaryYearsCompleted();
    let yearsNum = isAnniversaryDay() ? completed : completed + 1;
    let yearsOrd = yearsNum + ". İl";

    pc.innerHTML =
      /* ── HERO ── */
      '<div class="anni-hero-section">' +
        '<div class="anni-hero-orbs">' +
          '<div class="anni-orb anni-orb-1"></div>' +
          '<div class="anni-orb anni-orb-2"></div>' +
          '<div class="anni-orb anni-orb-3"></div>' +
        '</div>' +
        '<div class="anni-hero-inner">' +
          '<div class="anni-hero-badge"><span class="anni-badge-sparkle"><i class="fa-solid fa-sparkles"></i></span><span>İL DÖNÜMÜ</span><span class="anni-badge-sparkle"><i class="fa-solid fa-sparkles"></i></span></div>' +
          '<h2 class="anni-hero-title">Hüseyn <span class="anni-hero-amp">&</span> Cəmalə</h2>' +
          '<p class="anni-hero-sub">' + yearsOrd + ' Dönümünə Geri Sayım <i class="fa-solid fa-ring"></i></p>' +
          '<div id="anni-display" class="anni-display">' +
            '<div class="anni-time-block"><span class="anni-num" id="anni-days">--</span><label>Gün</label></div>' +
            '<div class="anni-sep">:</div>' +
            '<div class="anni-time-block"><span class="anni-num" id="anni-hours">--</span><label>Saat</label></div>' +
            '<div class="anni-sep">:</div>' +
            '<div class="anni-time-block"><span class="anni-num" id="anni-mins">--</span><label>Dəqiqə</label></div>' +
            '<div class="anni-sep">:</div>' +
            '<div class="anni-time-block"><span class="anni-num" id="anni-secs">--</span><label>Saniyə</label></div>' +
          '</div>' +
          '<p id="anni-arrived-msg" class="anni-arrived-msg anni-hidden"><i class="fa-solid fa-party-horn"></i> ' + yearsOrd + ' İL TAMAM OLDU! <i class="fa-solid fa-champagne-glasses"></i></p>' +
          '<div class="anni-hero-hearts">' +
            '<span class="anni-h1"><i class="fa-solid fa-heart" style="color:#ff4d6d"></i></span>' +
            '<span class="anni-h2"><i class="fa-solid fa-heart" style="color:#ff4d6d"></i></span>' +
            '<span class="anni-h3"><i class="fa-solid fa-heart" style="color:#ff4d6d"></i></span>' +
          '</div>' +
        '</div>' +
      '</div>' +

      /* ── STATS ── */
      '<div class="anni-love-stats">' +
        '<div class="anni-love-stat">' +
          '<div class="anni-love-stat-icon"><i class="fa-solid fa-calendar-days"></i></div>' +
          '<div class="anni-love-stat-val" id="anni-stat-days">...</div>' +
          '<div class="anni-love-stat-lbl">Gün Birlikdə</div>' +
        '</div>' +
        '<div class="anni-love-stat">' +
          '<div class="anni-love-stat-icon"><i class="fa-solid fa-heart"></i></div>' +
          '<div class="anni-love-stat-val" id="anni-stat-hrs">...</div>' +
          '<div class="anni-love-stat-lbl">Saat Sevgi</div>' +
        '</div>' +
        '<div class="anni-love-stat">' +
          '<div class="anni-love-stat-icon"><i class="fa-solid fa-star"></i></div>' +
          '<div class="anni-love-stat-val">' + (completed > 0 ? completed : '~1') + '</div>' +
          '<div class="anni-love-stat-lbl">İl Dönümü</div>' +
        '</div>' +
        '<div class="anni-love-stat">' +
          '<div class="anni-love-stat-icon anni-inf"><i class="fa-solid fa-infinity"></i></div>' +
          '<div class="anni-love-stat-val"><i class="fa-solid fa-infinity"></i></div>' +
          '<div class="anni-love-stat-lbl">Sevgi</div>' +
        '</div>' +
      '</div>' +

      /* ── DAILY MSG ── */
      '<div class="anni-daily-card">' +
        '<div class="anni-daily-header">' +
          '<span class="anni-daily-badge"><i class="fa-solid fa-envelope"></i> BU GÜNÜN MESAJI</span>' +
          '<div class="anni-daily-date" id="anni-daily-date"></div>' +
        '</div>' +
        '<p class="anni-daily-label" id="anni-day-label">Yüklənir...</p>' +
        '<blockquote class="anni-daily-msg" id="anni-daily-msg">Hər gün sənlə daha gözəldir... <i class="fa-solid fa-heart"></i></blockquote>' +
      '</div>' +

      /* ── WORD CLOUD ── */
      '<div class="anni-cloud-section">' +
        '<h3 class="anni-section-title"><span class="anni-title-gem"><i class="fa-solid fa-cloud"></i></span> Söz Buludu</h3>' +
        '<div class="anni-cloud-card">' +
          '<div class="anni-cloud" id="anni-wordcloud"><div class="anni-cloud-empty"><i class="fa-solid fa-spinner fa-spin"></i> Notlar yüklənir...</div></div>' +
          '<p class="anni-cloud-note">Notlarımızdakı ən çox işlənən sözlərdən bir ürək düzəltdim — hamısı səninlə bağlıdır.</p>' +
        '</div>' +
      '</div>' +

      /* ── TIMELINE ── */
      '<div class="anni-timeline-section">' +
        '<h3 class="anni-section-title"><span class="anni-title-gem"><i class="fa-regular fa-gem"></i></span> Sevgimizin Yolu</h3>' +
        '<div class="anni-timeline">' +
          mkTL('<i class="fa-solid fa-heart"></i>', "3 Avqust 2025", "İlk addım — birlikdəyik <i class=\"fa-solid fa-rose\"></i>", true) +
          mkTL('<i class="fa-solid fa-seedling"></i>', "3 Noyabr 2025", "3 ay — hər gün daha çox sevgi <i class=\"fa-solid fa-heart\"></i>", true) +
          mkTL('<i class="fa-solid fa-champagne-glasses"></i>', "3 Fevral 2026", "6 ay — yarım il birlikdə! <i class=\"fa-solid fa-party-horn\"></i>", true) +
          mkTL('<i class="fa-solid fa-moon"></i>', "3 May 2026", "9 ay — demək olar ki bir il! <i class=\"fa-solid fa-sparkles\"></i>", false, "anni-tl-9m") +
          mkTL('<i class="fa-solid fa-gift"></i>', "3 Avqust 2026", "1 İL! — bu günü gözləyirəm <i class=\"fa-solid fa-trophy\"></i>", false, "anni-tl-1y", true) +
        '</div>' +
      '</div>' +

      /* ── STORY ── */
      '<div class="anni-story-section">' +
        '<h3 class="anni-section-title"><span class="anni-title-gem"><i class="fa-solid fa-envelope-open-heart"></i></span> Bizim Hekayəmiz</h3>' +
        '<div class="anni-story-cards">' +
          mkStory('<i class="fa-solid fa-sun"></i>', "İlk Addım", "3 Avqust 2025-ci ildə başladı. O gün hər şey dəyişdi. Bir baxış, bir gülüş — və ömür boyu sürecek bir sevgi.") +
          mkStory('<i class="fa-solid fa-star"></i>', "Hər Gün Yeni Kəşf", "Hər səhər sənlə yeni bir şey öyrənirəm. Gülüşün, baxışın, sözlərin — hamısı qəlbimə hakmişdir.") +
          mkStory('<i class="fa-solid fa-heart-pulse"></i>', "Hər Çətinlikdə Birlikdə", "Dünya nə qədər çətin olursa olsun, sən varsan — hər şey asanlaşır. Sən mənim ən böyük gücümsən.") +
        '</div>' +
      '</div>' +

      /* ── SLIDESHOW ── */
      '<div class="anni-slideshow-section">' +
        '<h3 class="anni-section-title"><span class="anni-title-gem"><i class="fa-solid fa-film"></i></span> Xatirələrimiz</h3>' +
        '<div class="anni-slideshow" id="anni-slideshow">' +
          '<div class="anni-slide-viewport" id="anni-slide-viewport">' +
            '<div class="anni-slide-loading"><i class="fa-solid fa-spinner fa-spin"></i><span>Şəkillər yüklənir...</span></div>' +
          '</div>' +
          '<div class="anni-slide-progress-bar"><div class="anni-slide-progress-fill" id="anni-progress-fill"></div></div>' +
          '<div class="anni-slide-controls">' +
            '<button class="anni-slide-btn" id="anni-slide-prev" aria-label="Əvvəlki"><i class="fa-solid fa-chevron-left"></i></button>' +
            '<button class="anni-slide-play-btn" id="anni-slide-play" aria-label="Oxut/Dayan"><i class="fa-solid fa-pause"></i></button>' +
            '<button class="anni-slide-btn" id="anni-slide-next" aria-label="Sonrakı"><i class="fa-solid fa-chevron-right"></i></button>' +
          '</div>' +
          '<div class="anni-slide-counter" id="anni-slide-counter">1 / 1</div>' +
        '</div>' +
      '</div>' +

      /* ── TIMECAPSULE ── */
      '<div class="anni-capsule-section">' +
        '<div class="anni-capsule-header">' +
          '<span class="anni-capsule-badge"><i class="fa-solid fa-clock-rotate-left"></i> ZAMAN KAPSULU</span>' +
          '<span id="anni-capsule-year" style="font-size:.75rem;color:rgba(255,255,255,.4)">Yüklənir...</span>' +
        '</div>' +
        '<div class="anni-capsule-stats" id="anni-capsule-stats">' +
          '<div class="anni-capsule-stat"><div class="anni-capsule-stat-icon"><i class="fa-regular fa-images"></i></div><div class="anni-capsule-stat-num" id="capsule-photos">-</div><div class="anni-capsule-stat-lbl">Şəkil</div></div>' +
          '<div class="anni-capsule-stat"><div class="anni-capsule-stat-icon"><i class="fa-regular fa-note-sticky"></i></div><div class="anni-capsule-stat-num" id="capsule-notes">-</div><div class="anni-capsule-stat-lbl">Not</div></div>' +
          '<div class="anni-capsule-stat"><div class="anni-capsule-stat-icon"><i class="fa-solid fa-clapperboard"></i></div><div class="anni-capsule-stat-num" id="capsule-films">-</div><div class="anni-capsule-stat-lbl">Film</div></div>' +
        '</div>' +
        '<div class="anni-capsule-months" id="anni-capsule-months"></div>' +
        '<p class="anni-capsule-note" id="anni-capsule-note">İl ərzində hər an səninlə xatirələr yığdıq. Hər şəkil, hər not, hər film — bir parça sən.</p>' +
      '</div>' +



      /* ── CANDLE ── */
      '<div class="anni-candle-section">' +
        '<div class="anni-capsule-header">' +
          '<span class="anni-capsule-badge"><i class="fa-solid fa-candle-holder"></i> ARZU ŞAMI</span>' +
          '<span style="font-size:.7rem;color:rgba(255,255,255,.4)">Üfürərək söndür</span>' +
        '</div>' +
        '<div class="anni-candle-scene" id="anni-candle-scene">' +
          '<div class="anni-candle-body" id="anni-candle-body">' +
            '<div class="anni-candle-wax"></div>' +
            '<div class="anni-candle-wick"></div>' +
            '<div class="anni-flame" id="anni-flame"></div>' +
          '</div>' +
          '<div class="anni-candle-smoke" id="anni-candle-smoke"></div>' +
          '<p class="anni-candle-hint" id="anni-candle-hint">Şamı söndürmək üçün mikrofona üfür 🕯️</p>' +
          '<div class="anni-candle-surprise" id="anni-candle-surprise">' +
            '<div class="anni-candle-hearts">🎉💖✨</div>' +
            '<h3>Arzun Qəbul Oldu! 🎊</h3>' +
            '<p>Bu il də səninlə olmaq ən böyük arzum idi. Növbəti il də səninlə olmaq ən böyük diləyimdir. Səni çox sevirəm! ❤️</p>' +
            '<button class="anni-candle-btn" id="anni-candle-reload">Şamı yenidən yandır</button>' +
          '</div>' +
        '</div>' +
        '<button class="anni-candle-blow-btn" id="anni-candle-blow-btn"><i class="fa-solid fa-microphone"></i> Üfürmək üçün mikrofona icazə ver</button>' +
      '</div>' +

      /* ── CTA ── */
      '<div class="anni-cta-section">' +
        '<button id="anni-celebrate-btn" class="anni-celebrate-btn">' +
          '<span><i class="fa-solid fa-party-horn"></i></span><span>İl Dönümünü Keçir!</span><span><i class="fa-solid fa-champagne-glasses"></i></span>' +
        '</button>' +
      '</div>';

    updateLoveStats();
    runCountdown();
    markTimelineProgress();
    patchDailyMessage();

    /* CTA button */
    setTimeout(function () {
      let btn = document.getElementById("anni-celebrate-btn");
      if (btn) {
        btn.addEventListener("click", function () {
          showAnniversaryScreen();
          setTimeout(launchConfetti, 1000);
        });
      }
    }, 100);
  }

  function mkTL(icon, date, text, done, id, future) {
    let cls = "anni-tl-item" + (done ? " anni-tl-done" : "") + (future ? " anni-tl-future" : "");
    let idAttr = id ? ' id="' + id + '"' : "";
    return '<div class="' + cls + '"' + idAttr + '>' +
      '<div class="anni-tl-dot' + (future ? " anni-tl-dot-star" : "") + '"><span>' + icon + '</span></div>' +
      '<div class="anni-tl-body"><strong>' + date + '</strong><p>' + text + '</p></div>' +
    '</div>';
  }

  function mkStory(icon, title, text) {
    return '<div class="anni-story-card">' +
      '<div class="anni-story-icon">' + icon + '</div>' +
      '<h4>' + title + '</h4>' +
      '<p>' + text + '</p>' +
    '</div>';
  }

  function updateLoveStats() {
    let days = Math.max(0, getDaysSinceStart());
    let dEl = document.getElementById("anni-stat-days");
    let hEl = document.getElementById("anni-stat-hrs");
    if (dEl) dEl.textContent = days.toLocaleString();
    if (hEl) hEl.textContent = (days * 24).toLocaleString();
  }

  function markTimelineProgress() {
    let now = new Date();
    let may2026 = new Date(2026, 4, 3);
    let aug2026 = new Date(2026, 7, 3);
    let tl9m = document.getElementById("anni-tl-9m");
    let tl1y = document.getElementById("anni-tl-1y");
    if (tl9m && now >= may2026) tl9m.classList.add("anni-tl-done");
    if (tl1y && now >= aug2026) {
      tl1y.classList.remove("anni-tl-future");
      tl1y.classList.add("anni-tl-done");
    }
  }

  /* ─── GERİ SAYIM ────────────────────────────────────────── */
  function runCountdown() {
    function tick() {
      if (isAnniversaryDay()) {
        let disp = document.getElementById("anni-display");
        let arr = document.getElementById("anni-arrived-msg");
        if (disp) disp.style.display = "none";
        if (arr) arr.classList.remove("anni-hidden");
        // Main screen
        let mainDisp = document.getElementById("main-anni-display");
        let mainArr = document.getElementById("main-anni-arrived-msg");
        if (mainDisp) mainDisp.style.display = "none";
        if (mainArr) mainArr.classList.remove("anni-hidden");
        
        if (typeof patchNavbarForAnniversary === 'function') {
          patchNavbarForAnniversary();
        }
        return;
      }
      let r = getDaysUntilAnniversary();
      if (!r) return;
      function sv(id, val) {
        let el = document.getElementById(id);
        if (el) el.textContent = String(val).padStart(2, "0");
      }
      sv("anni-days", r.total);
      sv("anni-hours", r.hours);
      sv("anni-mins", r.minutes);
      sv("anni-secs", r.seconds);

      // Main screen
      sv("main-anni-days", r.total);
      sv("main-anni-hours", r.hours);
      sv("main-anni-mins", r.minutes);
      sv("main-anni-secs", r.seconds);
    }
    tick();
    setInterval(tick, 1000);
  }

  /* ─── GÜN MESAJINI YENİLƏ ───────────────────────────────── */
  function patchDailyMessage() {
    let msg = getTodayMessage();
    if (!msg) return;
    let lbl = getDayLabel();
    let fmt = new Date().toLocaleDateString("az-AZ", { day: "numeric", month: "long", year: "numeric" });

    /* Ana səhifə */
    let t = document.getElementById("daily-message-text");
    let ti = document.getElementById("daily-message-title");
    let d = document.getElementById("daily-message-date");
    if (t) t.textContent = msg;
    if (ti) ti.innerHTML = lbl + ' <i class="fas fa-heart"></i>';
    if (d) d.innerHTML = '<i class="fas fa-calendar-day"></i> ' + fmt;

    /* İl dönümü səhifəsi */
    let amsg = document.getElementById("anni-daily-msg");
    let albl = document.getElementById("anni-day-label");
    let adate = document.getElementById("anni-daily-date");
    if (amsg) amsg.textContent = msg;
    if (albl) albl.textContent = lbl;
    if (adate) adate.textContent = fmt;
  }

  /* ─── TAM EKRAN İL DÖNÜMÜ ───────────────────────────────── */
  function showAnniversaryScreen() {
    let screen = document.getElementById("anniversary-screen");
    if (!screen) return;

    let yrs = Math.max(1, getAnniversaryYearsCompleted() || 1);
    let days = Math.max(365, getDaysSinceStart());
    let hrs = (days * 24).toLocaleString();

    screen.innerHTML =
      '<canvas id="anni-canvas" class="anni-canvas"></canvas>' +
      '<div class="anni-content"><div class="anni-content-inner">' +
        '<div class="anni-badge-top">Hüseyn &amp; Cəmalə <i class="fa-solid fa-heart"></i></div>' +
        '<div class="anni-year-display"><div class="anni-year-ring"><div class="anni-year-core">' +
          '<span class="anni-year-num">' + yrs + '</span><span class="anni-year-text">İL</span>' +
        '</div></div></div>' +
        '<h2 class="anni-headline">' + (yrs === 1 ? 'Bir il əvvəl iki ayrı dünya vardı —' : yrs + ' il birlikdə —') + '<br><span class="anni-headline-gold">İndi bir dünyamız var.</span></h2>' +
        '<p class="anni-sub-quote">"' + days.toLocaleString() + ' gün, ' + hrs + ' saat — hər saniyəni sənlə yaşadım ki, bu günü yaşaya bilim. <strong>Bizim il dönümümüzdür, Sevgilim. <i class="fa-solid fa-heart"></i></strong>"</p>' +
        '<div class="anni-stats-row">' +
          '<div class="anni-stat"><strong>' + days.toLocaleString() + '</strong><span>Gün</span></div>' +
          '<div class="anni-stat-div"><i class="fa-solid fa-heart"></i></div>' +
          '<div class="anni-stat"><strong>' + hrs + '</strong><span>Saat</span></div>' +
          '<div class="anni-stat-div"><i class="fa-solid fa-heart"></i></div>' +
          '<div class="anni-stat"><strong>∞</strong><span>Sevgi</span></div>' +
        '</div>' +
        '<button id="anni-enter-btn" class="anni-enter-btn"><span>Dünyamıza Gir</span> <i class="fas fa-heart"></i></button>' +
      '</div></div>';

    screen.style.display = "flex";
    requestAnimationFrame(function () { initFireworks(); initHearts(); });

    setTimeout(function () {
      let btn = document.getElementById("anni-enter-btn");
      if (btn) {
        btn.addEventListener("click", function () {
          screen.style.animation = "anniFadeOut 0.8s ease forwards";
          setTimeout(function () { screen.style.display = "none"; screen.style.animation = ""; }, 800);
        });
      }
    }, 100);
  }

  /* ─── FIREWORKS ─────────────────────────────────────────── */
  function initFireworks() {
    let canvas = document.getElementById("anni-canvas");
    if (!canvas) return;
    let ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    window.addEventListener("resize", function () {
      canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    });
    let COLORS = ["#FFD700", "#FF6B6B", "#FF1493", "#FF69B4", "#FFA500", "#FFFFFF", "#FFE4E1", "#FFB6C1"];
    let particles = [];

    function Particle(x, y, color) {
      this.x = x; this.y = y; this.color = color;
      let angle = Math.random() * Math.PI * 2, speed = 2 + Math.random() * 6;
      this.vx = Math.cos(angle) * speed; this.vy = Math.sin(angle) * speed;
      this.alpha = 1; this.decay = 0.012 + Math.random() * 0.015;
      this.size = 2 + Math.random() * 3; this.gravity = 0.08;
    }
    Particle.prototype.update = function () {
      this.x += this.vx; this.y += this.vy; this.vy += this.gravity;
      this.vx *= 0.98; this.alpha -= this.decay;
    };
    Particle.prototype.draw = function (c) {
      c.save(); c.globalAlpha = Math.max(0, this.alpha);
      c.fillStyle = this.color; c.shadowColor = this.color; c.shadowBlur = 8;
      c.beginPath(); c.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      c.fill(); c.restore();
    };
    Particle.prototype.isDead = function () { return this.alpha <= 0; };

    function burst(x, y) {
      let c = COLORS[Math.floor(Math.random() * COLORS.length)];
      for (let i = 0; i < 70; i++) particles.push(new Particle(x, y, c));
    }
    let lastBurst = 0;
    function loop(ts) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (ts - lastBurst > 700 + Math.random() * 400) {
        burst(canvas.width * (0.15 + Math.random() * 0.7), canvas.height * (0.1 + Math.random() * 0.5));
        if (Math.random() > 0.5) burst(canvas.width * (0.15 + Math.random() * 0.7), canvas.height * (0.1 + Math.random() * 0.5));
        lastBurst = ts;
      }
      for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update(); particles[i].draw(ctx);
        if (particles[i].isDead()) particles.splice(i, 1);
      }
      requestAnimationFrame(loop);
    }
    setTimeout(function () { burst(canvas.width * 0.3, canvas.height * 0.3); }, 200);
    setTimeout(function () { burst(canvas.width * 0.7, canvas.height * 0.25); }, 500);
    setTimeout(function () { burst(canvas.width * 0.5, canvas.height * 0.4); }, 900);
    requestAnimationFrame(loop);
  }

  /* ─── UÇAN ÜRƏKLƏR ─────────────────────────────────────── */
  function initHearts() {
    let container = document.getElementById("anniversary-screen");
    if (!container) return;
    let hearts = ["❤️", "🧡", "💛", "💕", "💖", "💗", "💓"];
    function spawnHeart() {
      let span = document.createElement("span");
      span.className = "anni-floating-heart";
      span.textContent = hearts[Math.floor(Math.random() * hearts.length)];
      let dir = (Math.random() > 0.5 ? 1 : -1) * (20 + Math.random() * 30);
      let rot = Math.floor(Math.random() * 60 - 30);
      span.style.cssText = "left:" + (Math.random() * 100) + "%;font-size:" + (14 + Math.random() * 20) + "px;" +
        "animation-duration:" + (4 + Math.random() * 5) + "s;animation-delay:" + (Math.random() * 1.5) + "s;" +
        "--anni-heart-dir:" + dir + "px;--anni-heart-rot:" + rot + "deg;";
      container.appendChild(span);
      setTimeout(function () { span.remove(); }, 11000);
    }
    for (let i = 0; i < 10; i++) (function (d) { setTimeout(spawnHeart, d * 250); })(i);
    let iv = setInterval(spawnHeart, 600);
    setTimeout(function () { clearInterval(iv); }, 30000);
  }

  /* ─── KONFETTİ ──────────────────────────────────────────── */
  function launchConfetti() {
    let colors = ["#FFD700", "#FF6B6B", "#FF1493", "#00FF7F", "#1E90FF", "#FFFFFF"];
    let container = document.getElementById("anniversary-screen");
    if (!container) return;
    for (let i = 0; i < 100; i++) {
      let p = document.createElement("div");
      p.className = "anni-confetti";
      p.style.cssText = "left:" + (Math.random() * 100) + "%;background:" + colors[Math.floor(Math.random() * colors.length)] + ";" +
        "width:" + (5 + Math.random() * 8) + "px;height:" + (8 + Math.random() * 10) + "px;" +
        "animation-duration:" + (2 + Math.random() * 3) + "s;animation-delay:" + (Math.random() * 2) + "s;" +
        "transform:rotate(" + (Math.random() * 360) + "deg);border-radius:" + (Math.random() > 0.5 ? "50%" : "2px") + ";";
      container.appendChild(p);
      setTimeout(function () { p.remove(); }, 6000);
    }
  }

  /* ─── CSS İNJEKT ────────────────────────────────────────── */
  function injectStyles() {
    let style = document.createElement("style");
    style.textContent = [
      /* ── Hero ── */
      ".anni-hero-section{position:relative;border-radius:28px;overflow:hidden;",
      "background:linear-gradient(135deg,rgba(80,0,30,.55) 0%,rgba(30,0,60,.6) 50%,rgba(10,0,20,.7) 100%);",
      "border:1px solid rgba(255,215,0,.18);padding:40px 24px 32px;text-align:center;margin-bottom:20px;",
      "box-shadow:0 12px 48px rgba(139,0,0,.35),inset 0 1px 0 rgba(255,215,0,.12)}",
      ".anni-hero-orbs{position:absolute;inset:0;pointer-events:none;overflow:hidden}",
      ".anni-orb{position:absolute;border-radius:50%;filter:blur(60px);opacity:.35}",
      ".anni-orb-1{width:220px;height:220px;background:#FFD700;top:-60px;left:-60px;animation:anniOrbPulse 6s ease-in-out infinite}",
      ".anni-orb-2{width:180px;height:180px;background:#FF1493;bottom:-40px;right:-40px;animation:anniOrbPulse 8s ease-in-out infinite reverse}",
      ".anni-orb-3{width:140px;height:140px;background:#FF6B6B;top:50%;left:50%;transform:translate(-50%,-50%);animation:anniOrbPulse 5s ease-in-out infinite 1s}",
      "@keyframes anniOrbPulse{0%,100%{transform:scale(1);opacity:.35}50%{transform:scale(1.2);opacity:.5}}",
      ".anni-hero-inner{position:relative;z-index:1}",
      ".anni-hero-badge{display:inline-flex;align-items:center;gap:8px;font-size:.7rem;font-weight:700;letter-spacing:.15em;",
      "color:#FFD700;text-transform:uppercase;background:rgba(255,215,0,.1);border:1px solid rgba(255,215,0,.3);",
      "border-radius:100px;padding:5px 16px;margin-bottom:18px}",
      ".anni-badge-sparkle{animation:anniSparkle 2s ease-in-out infinite}",
      "@keyframes anniSparkle{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(1.4)}}",
      ".anni-hero-title{font-size:clamp(1.8rem,5vw,2.6rem);font-weight:900;",
      "background:linear-gradient(135deg,#FFD700 0%,#FF6B6B 50%,#FF1493 100%);",
      "-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;",
      "margin:0 0 8px;letter-spacing:-.02em;text-shadow:none}",
      ".anni-hero-amp{font-size:.8em;opacity:.8}",
      ".anni-hero-sub{font-size:.95rem;color:rgba(255,255,255,.75);margin:0 0 28px;font-weight:500}",
      ".anni-hero-hearts{display:flex;justify-content:center;gap:16px;margin-top:20px;font-size:1.4rem}",
      ".anni-h1{animation:anniHeartBeat 1.2s ease-in-out infinite}",
      ".anni-h2{animation:anniHeartBeat 1.2s ease-in-out infinite .2s}",
      ".anni-h3{animation:anniHeartBeat 1.2s ease-in-out infinite .4s}",
      "@keyframes anniHeartBeat{0%,100%{transform:scale(1)}50%{transform:scale(1.25)}}",
      /* ── Anniversary Countdown Modal ── */
      ".anni-modal-overlay{position:fixed;inset:0;z-index:100000;display:flex;align-items:center;justify-content:center;",
      "padding:20px;background:rgba(0,0,0,.65);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);",
      "animation:anniModalFade .3s ease}",
      "@keyframes anniModalFade{from{opacity:0}to{opacity:1}}",
      ".anni-modal-card{width:100%;max-width:400px;text-align:center;padding:38px 26px 30px;border-radius:30px;",
      "background:linear-gradient(160deg,#1c000a,#260019 55%,#2b0a32);position:relative;overflow:hidden;",
      "border:1px solid rgba(255,215,0,.25);box-shadow:0 0 70px rgba(255,215,0,.18),0 28px 90px rgba(0,0,0,.65),",
      "inset 0 1px 0 rgba(255,215,0,.15);animation:anniModalPop .5s cubic-bezier(.16,1,.3,1)}",
      ".anni-modal-card::before{content:'';position:absolute;top:-60px;left:50%;transform:translateX(-50%);",
      "width:200px;height:200px;background:radial-gradient(circle,rgba(255,215,0,.18),transparent 70%);pointer-events:none}",
      "@keyframes anniModalPop{from{opacity:0;transform:translateY(28px) scale(.93)}to{opacity:1;transform:translateY(0) scale(1)}}",
      ".anni-modal-icon{font-size:3rem;margin-bottom:10px;line-height:1;animation:anniHeartBeat 1.3s ease-in-out infinite}",
      ".anni-modal-badge{display:inline-block;font-size:.6rem;font-weight:700;letter-spacing:.16em;color:#FFD700;",
      "text-transform:uppercase;background:rgba(255,215,0,.1);border:1px solid rgba(255,215,0,.3);",
      "border-radius:100px;padding:5px 14px;margin-bottom:16px}",
      ".anni-modal-title{font-size:1.35rem;font-weight:800;color:rgba(255,255,255,.95);margin:0 0 10px;line-height:1.45}",
      ".anni-modal-title strong{color:#FFD700;font-size:1.55rem}",
      ".anni-modal-text{font-size:.9rem;color:rgba(255,255,255,.65);margin:0 0 14px;line-height:1.7}",
      ".anni-modal-hearts{display:flex;justify-content:center;gap:10px;font-size:1.1rem;margin-bottom:22px}",
      ".anni-modal-hearts i{animation:anniHeartBeat 1.2s ease-in-out infinite}",
      ".anni-modal-hearts i:nth-child(2){animation-delay:.2s}.anni-modal-hearts i:nth-child(3){animation-delay:.4s}",
      ".anni-modal-actions{display:flex;justify-content:center}",
      ".anni-modal-close{display:inline-flex;align-items:center;gap:8px;background:linear-gradient(135deg,#FFD700,#FF6B6B);",
      "border:none;border-radius:100px;padding:13px 38px;color:#000;font-weight:800;font-size:.9rem;cursor:pointer;",
      "font-family:inherit;box-shadow:0 6px 26px rgba(255,215,0,.35);transition:transform .2s,box-shadow .2s}",
      ".anni-modal-close:hover{transform:scale(1.05);box-shadow:0 8px 34px rgba(255,215,0,.5)}",
      ".anni-modal-close:active{transform:scale(.97)}",
      "@media(max-width:480px){.anni-modal-card{padding:32px 20px 24px}.anni-modal-title{font-size:1.15rem}}",
      /* ── Countdown ── */
      ".anni-display{display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:0}",
      ".anni-time-block{display:flex;flex-direction:column;align-items:center;gap:4px;min-width:68px;",
      "background:rgba(255,215,0,.08);border:1px solid rgba(255,215,0,.2);border-radius:16px;padding:12px 8px}",
      ".anni-num{font-size:clamp(1.6rem,5vw,2rem);font-weight:800;",
      "background:linear-gradient(135deg,#FFD700,#FF6B6B);-webkit-background-clip:text;",
      "-webkit-text-fill-color:transparent;background-clip:text;line-height:1;",
      "font-variant-numeric:tabular-nums;min-width:2ch;text-align:center}",
      ".anni-time-block label{font-size:.58rem;text-transform:uppercase;letter-spacing:.1em;color:rgba(255,255,255,.5);font-weight:600}",
      ".anni-sep{font-size:1.6rem;font-weight:800;color:rgba(255,215,0,.5);margin-top:-10px;animation:anniBlink 1s step-end infinite}",
      "@keyframes anniBlink{0%,100%{opacity:1}50%{opacity:.3}}",
      ".anni-arrived-msg{font-size:1.2rem;font-weight:800;color:#FFD700;text-align:center;padding:12px;",
      "animation:anniBounce 1s ease-in-out infinite}",
      "@keyframes anniBounce{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}",
      ".anni-hidden{display:none!important}",
      /* ── Love Stats ── */
      ".anni-love-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px}",
      "@media(max-width:480px){.anni-love-stats{grid-template-columns:repeat(2,1fr)}}",
      ".anni-love-stat{background:linear-gradient(135deg,rgba(255,215,0,.07),rgba(255,100,100,.07));",
      "border:1px solid rgba(255,215,0,.15);border-radius:18px;padding:16px 8px;text-align:center;",
      "transition:transform .2s,box-shadow .2s}",
      ".anni-love-stat:hover{transform:translateY(-3px);box-shadow:0 8px 24px rgba(255,215,0,.15)}",
      ".anni-love-stat-icon{font-size:1.4rem;margin-bottom:6px}",
      ".anni-inf{font-size:1.8rem;font-weight:900;color:#FFD700;line-height:1}",
      ".anni-love-stat-val{font-size:1.1rem;font-weight:800;",
      "background:linear-gradient(135deg,#FFD700,#FF6B6B);-webkit-background-clip:text;",
      "-webkit-text-fill-color:transparent;background-clip:text;line-height:1.2}",
      ".anni-love-stat-lbl{font-size:.6rem;text-transform:uppercase;letter-spacing:.08em;color:rgba(255,255,255,.45);margin-top:4px}",
      /* ── Daily Card ── */
      ".anni-daily-card{background:linear-gradient(135deg,rgba(30,0,60,.5),rgba(80,0,30,.4));",
      "border:1px solid rgba(255,215,0,.15);border-radius:24px;padding:24px 22px;margin-bottom:20px;",
      "box-shadow:0 4px 24px rgba(139,0,0,.2)}",
      ".anni-daily-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:8px}",
      ".anni-daily-badge{font-size:.68rem;font-weight:700;letter-spacing:.1em;color:#FFD700;",
      "background:rgba(255,215,0,.1);border:1px solid rgba(255,215,0,.25);border-radius:100px;padding:4px 12px}",
      ".anni-daily-date{font-size:.72rem;color:rgba(255,255,255,.45)}",
      ".anni-daily-label{font-size:.9rem;font-weight:600;color:rgba(255,215,0,.8);margin:0 0 10px}",
      ".anni-daily-msg{font-size:1rem;color:rgba(255,255,255,.85);line-height:1.75;font-style:italic;",
      "margin:0;padding-left:14px;border-left:3px solid rgba(255,215,0,.4)}",
      /* ── Word Cloud ── */
      ".anni-cloud-section{margin-bottom:24px}",
      ".anni-cloud-card{background:linear-gradient(135deg,rgba(60,0,20,.35),rgba(30,0,60,.3));",
      "border:1px solid rgba(255,215,0,.12);border-radius:24px;padding:16px;overflow:hidden;",
      "box-shadow:0 4px 24px rgba(139,0,0,.15)}",
      ".anni-cloud{position:relative;width:100%;height:420px;overflow:hidden;",
      "background:radial-gradient(ellipse at center,rgba(255,215,0,.06),transparent 70%)}",
      "@media(max-width:480px){.anni-cloud{height:340px}}",
      ".anni-cloud-word{position:absolute;font-weight:700;white-space:nowrap;line-height:1.1;cursor:default;",
      "transform:rotate(var(--anni-rot,0deg));transition:transform .25s ease,text-shadow .25s ease;opacity:.9}",
      ".anni-cloud-word:hover{transform:scale(1.18) rotate(var(--anni-rot,0deg));z-index:5;opacity:1;",
      "text-shadow:0 0 12px rgba(255,215,0,.5)}",
      ".anni-cloud-empty{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;",
      "gap:8px;color:rgba(255,255,255,.4);font-size:.85rem}",
      ".anni-cloud-empty i{font-size:1.2rem;color:rgba(255,215,0,.5)}",
      ".anni-cloud-note{font-size:.72rem;color:rgba(255,255,255,.4);text-align:center;margin-top:14px;font-style:italic;line-height:1.5}",
      /* ── Timeline ── */
      ".anni-timeline-section{margin-bottom:24px}",
      ".anni-section-title{font-size:1rem;font-weight:700;color:#FFD700;",
      "display:flex;align-items:center;gap:8px;margin:0 0 18px;letter-spacing:.03em}",
      ".anni-title-gem{font-size:1.2rem}",
      ".anni-timeline{position:relative;padding-left:36px}",
      ".anni-timeline::before{content:'';position:absolute;left:14px;top:8px;bottom:8px;width:2px;",
      "background:linear-gradient(to bottom,rgba(255,215,0,.4),rgba(255,100,100,.2),rgba(255,215,0,.1))}",
      ".anni-tl-item{position:relative;margin-bottom:20px;opacity:.45;transition:opacity .4s}",
      ".anni-tl-item.anni-tl-done{opacity:1}",
      ".anni-tl-item.anni-tl-future{opacity:.3}",
      ".anni-tl-dot{position:absolute;left:-36px;width:30px;height:30px;border-radius:50%;",
      "background:rgba(255,215,0,.1);border:2px solid rgba(255,215,0,.3);",
      "display:flex;align-items:center;justify-content:center;font-size:.95rem;top:0;",
      "transition:border-color .4s,background .4s}",
      ".anni-tl-done .anni-tl-dot{background:rgba(255,215,0,.2);border-color:rgba(255,215,0,.6)}",
      ".anni-tl-dot-star{background:linear-gradient(135deg,rgba(255,215,0,.25),rgba(255,100,100,.2))!important;",
      "border-color:rgba(255,215,0,.7)!important;",
      "box-shadow:0 0 12px rgba(255,215,0,.35)}",
      ".anni-tl-body strong{font-size:.88rem;color:rgba(255,255,255,.9);font-weight:700;display:block;margin-bottom:2px}",
      ".anni-tl-body p{font-size:.8rem;color:rgba(255,255,255,.55);margin:0;line-height:1.5}",
      /* ── Story ── */
      ".anni-story-section{margin-bottom:24px}",
      ".anni-story-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}",
      "@media(max-width:580px){.anni-story-cards{grid-template-columns:1fr}}",
      ".anni-story-card{background:linear-gradient(135deg,rgba(255,215,0,.06),rgba(255,100,100,.06));",
      "border:1px solid rgba(255,215,0,.12);border-radius:20px;padding:20px 16px;text-align:center;",
      "transition:transform .25s,box-shadow .25s}",
      ".anni-story-card:hover{transform:translateY(-4px);box-shadow:0 10px 32px rgba(255,215,0,.12)}",
      ".anni-story-icon{font-size:2rem;margin-bottom:10px}",
      ".anni-story-card h4{font-size:.9rem;font-weight:700;color:#FFD700;margin:0 0 8px}",
      ".anni-story-card p{font-size:.78rem;color:rgba(255,255,255,.6);line-height:1.6;margin:0}",
      /* ── CTA ── */
      ".anni-cta-section{text-align:center;padding:8px 0 32px}",
      ".anni-celebrate-btn{display:inline-flex;align-items:center;gap:12px;padding:16px 40px;border:none;",
      "border-radius:100px;background:linear-gradient(135deg,#FFD700 0%,#FF6B6B 60%,#FF1493 100%);",
      "color:#000;font-size:1rem;font-weight:800;cursor:pointer;letter-spacing:.02em;font-family:inherit;",
      "box-shadow:0 6px 28px rgba(255,215,0,.45),0 12px 50px rgba(255,100,100,.25);",
      "transition:transform .2s,box-shadow .2s;animation:anniBtnPulse 2.5s ease-in-out infinite}",
      "@keyframes anniBtnPulse{0%,100%{box-shadow:0 6px 28px rgba(255,215,0,.45),0 12px 50px rgba(255,100,100,.25)}",
      "50%{box-shadow:0 8px 40px rgba(255,215,0,.7),0 16px 70px rgba(255,100,100,.4)}}",
      ".anni-celebrate-btn:hover{transform:scale(1.05)}.anni-celebrate-btn:active{transform:scale(.97)}",
      ".anni-cta-hint{font-size:.72rem;color:rgba(255,255,255,.35);margin-top:10px;letter-spacing:.04em}",
      /* ── Full Screen Overlay ── */
      "#anniversary-screen{position:fixed;inset:0;z-index:99999;display:none;align-items:center;justify-content:center;",
      "overflow:hidden;background:radial-gradient(ellipse at center,#1a0005 0%,#0d0010 40%,#000 100%)}",
      ".anni-canvas{position:absolute;inset:0;z-index:0;pointer-events:none}",
      ".anni-content{position:relative;z-index:10;width:100%;max-width:560px;padding:20px;text-align:center}",
      ".anni-content-inner{background:rgba(0,0,0,.58);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);",
      "border:1px solid rgba(255,215,0,.2);border-radius:32px;padding:36px 28px 32px;",
      "box-shadow:0 0 60px rgba(255,100,100,.2),0 0 120px rgba(255,215,0,.08),inset 0 1px 0 rgba(255,215,0,.15);",
      "animation:anniSlideUp .8s cubic-bezier(.16,1,.3,1) forwards}",
      "@keyframes anniSlideUp{from{opacity:0;transform:translateY(40px) scale(.95)}to{opacity:1;transform:translateY(0) scale(1)}}",
      "@keyframes anniFadeOut{from{opacity:1;transform:scale(1)}to{opacity:0;transform:scale(.95)}}",
      ".anni-badge-top{display:inline-flex;align-items:center;gap:6px;font-size:.7rem;font-weight:700;",
      "letter-spacing:.15em;text-transform:uppercase;color:#FFD700;background:rgba(255,215,0,.1);",
      "border:1px solid rgba(255,215,0,.3);border-radius:100px;padding:5px 14px;margin-bottom:24px}",
      ".anni-year-display{margin:0 auto 28px;width:130px;height:130px}",
      ".anni-year-ring{width:130px;height:130px;border-radius:50%;",
      "background:conic-gradient(from 0deg,#FFD700 0%,#FF6B6B 25%,#FF1493 50%,#FF6B6B 75%,#FFD700 100%);",
      "display:flex;align-items:center;justify-content:center;animation:anniRotate 8s linear infinite;",
      "box-shadow:0 0 30px rgba(255,215,0,.4),0 0 60px rgba(255,100,100,.2)}",
      "@keyframes anniRotate{from{transform:rotate(0)}to{transform:rotate(360deg)}}",
      ".anni-year-core{width:108px;height:108px;border-radius:50%;background:radial-gradient(circle,#1a0005,#0d0010);",
      "display:flex;flex-direction:column;align-items:center;justify-content:center;animation:anniRotate 8s linear infinite reverse}",
      ".anni-year-num{font-size:3rem;font-weight:900;background:linear-gradient(135deg,#FFD700,#FF6B6B);",
      "-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;line-height:1}",
      ".anni-year-text{font-size:.65rem;font-weight:800;letter-spacing:.2em;color:#FFD700;text-transform:uppercase;margin-top:2px}",
      ".anni-headline{font-size:1.1rem;font-weight:600;color:rgba(255,255,255,.85);line-height:1.6;margin-bottom:16px}",
      ".anni-headline-gold{color:#FFD700;font-weight:700}",
      ".anni-sub-quote{font-size:.82rem;color:rgba(255,255,255,.6);line-height:1.7;margin-bottom:28px;font-style:italic}",
      ".anni-sub-quote strong{color:rgba(255,255,255,.9);font-style:normal}",
      ".anni-stats-row{display:flex;align-items:center;justify-content:center;gap:16px;margin-bottom:32px}",
      ".anni-stat{display:flex;flex-direction:column;align-items:center;gap:2px}",
      ".anni-stat strong{font-size:1.4rem;font-weight:800;background:linear-gradient(135deg,#FFD700,#FF6B6B);",
      "-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}",
      ".anni-stat span{font-size:.65rem;text-transform:uppercase;letter-spacing:.1em;color:rgba(255,255,255,.5);font-weight:600}",
      ".anni-stat-div{font-size:1rem;opacity:.6}",
      ".anni-enter-btn{display:inline-flex;align-items:center;gap:10px;padding:15px 36px;border:none;",
      "border-radius:100px;background:linear-gradient(135deg,#FFD700 0%,#FF6B6B 100%);color:#000;",
      "font-size:.95rem;font-weight:700;cursor:pointer;letter-spacing:.02em;font-family:inherit;",
      "box-shadow:0 4px 20px rgba(255,215,0,.4),0 8px 40px rgba(255,100,100,.2);",
      "transition:transform .2s ease;animation:anniBtnPulse 2s ease-in-out infinite}",
      ".anni-enter-btn:hover{transform:scale(1.04)}.anni-enter-btn:active{transform:scale(.98)}",
      ".anni-floating-heart{position:absolute;bottom:-50px;pointer-events:none;z-index:5;",
      "animation:anniHeartFloat linear forwards}",
      "@keyframes anniHeartFloat{0%{bottom:-50px;opacity:0;transform:translateX(0) rotate(0)}",
      "10%{opacity:1}80%{opacity:.8}100%{bottom:110%;opacity:0;transform:translateX(var(--anni-heart-dir,30px)) rotate(var(--anni-heart-rot,15deg))}}",
      ".anni-confetti{position:absolute;top:-20px;z-index:5;pointer-events:none;animation:anniConfettiFall linear forwards}",
      "@keyframes anniConfettiFall{0%{top:-20px;opacity:1;transform:rotate(0) translateX(0)}",
      "100%{top:110vh;opacity:0;transform:rotate(720deg) translateX(60px)}}",
      "@media(max-width:480px){.anni-time-block{min-width:52px;padding:8px 6px}",
      ".anni-num{font-size:1.4rem}.anni-headline{font-size:.95rem}",
      ".anni-content-inner{padding:28px 18px 24px}",
      ".anni-year-display,.anni-year-ring{width:110px;height:110px}",
      ".anni-year-core{width:90px;height:90px}.anni-year-num{font-size:2.5rem}",
      ".anni-stats-row{gap:10px}.anni-stat strong{font-size:1.1rem}",
      ".anni-enter-btn{padding:13px 28px;font-size:.88rem}}",
      /* ── Slideshow ── */
      ".anni-slideshow-section{margin-bottom:28px}",
      ".anni-slideshow{position:relative;border-radius:24px;overflow:hidden;",
      "box-shadow:0 16px 56px rgba(0,0,0,.55),0 0 0 1px rgba(255,215,0,.12)}",
      ".anni-slide-viewport{position:relative;width:100%;height:320px;background:#0a0010;overflow:hidden;border-radius:24px 24px 0 0}",
      "@media(max-width:480px){.anni-slide-viewport{height:240px}}",
      ".anni-layer{position:absolute;inset:0;background-size:contain;background-repeat:no-repeat;background-position:center;",
      "transition:opacity 1.2s ease;opacity:1}",
      ".anni-layer-hidden{opacity:0}",
      /* Ken Burns keyframes */
      "@keyframes anniKB1{0%{transform:scale(1) translate(0,0)}100%{transform:scale(1.18) translate(-3%,-2%)}}",
      "@keyframes anniKB2{0%{transform:scale(1) translate(0,0)}100%{transform:scale(1.18) translate(3%,-2%)}}",
      "@keyframes anniKB3{0%{transform:scale(1.1) translate(-2%,1%)}100%{transform:scale(1) translate(2%,-1%)}}",
      "@keyframes anniKB4{0%{transform:scale(1.05) translate(2%,0)}100%{transform:scale(1.15) translate(-2%,2%)}}",
      ".anni-kb-1{animation:anniKB1 4s ease-out forwards}",
      ".anni-kb-2{animation:anniKB2 4s ease-out forwards}",
      ".anni-kb-3{animation:anniKB3 4s ease-in-out forwards}",
      ".anni-kb-4{animation:anniKB4 4s ease-in forwards}",
      /* Loading inside viewport */
      ".anni-slide-loading{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;",
      "justify-content:center;gap:10px;color:rgba(255,255,255,.5);font-size:.9rem}",
      ".anni-slide-loading i{font-size:1.6rem;color:rgba(255,215,0,.5)}",
      /* Progress bar */
      ".anni-slide-progress-bar{height:3px;background:rgba(255,255,255,.12);border-radius:0}",
      ".anni-slide-progress-fill{height:100%;background:linear-gradient(90deg,#FFD700,#FF6B6B);border-radius:0;width:0}",
      /* Controls */
      ".anni-slide-controls{display:flex;align-items:center;justify-content:center;gap:12px;",
      "padding:14px 16px;background:rgba(0,0,0,.35);backdrop-filter:blur(8px)}",
      ".anni-slide-btn{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.15);",
      "border-radius:50%;width:38px;height:38px;display:flex;align-items:center;justify-content:center;",
      "color:rgba(255,255,255,.8);cursor:pointer;font-size:.85rem;transition:all .2s}",
      ".anni-slide-btn:hover{background:rgba(255,215,0,.2);border-color:rgba(255,215,0,.4);color:#FFD700}",
      ".anni-slide-play-btn{background:linear-gradient(135deg,#FFD700,#FF6B6B);border:none;",
      "border-radius:50%;width:46px;height:46px;display:flex;align-items:center;justify-content:center;",
      "color:#000;cursor:pointer;font-size:1rem;transition:transform .2s;box-shadow:0 4px 16px rgba(255,215,0,.35)}",
      ".anni-slide-play-btn:hover{transform:scale(1.1)}",
      ".anni-slide-counter{text-align:center;font-size:.7rem;color:rgba(255,255,255,.35);",
      "padding:0 16px 12px;letter-spacing:.06em;font-weight:600}",

      /* ── Virtual Candle ── */
      ".anni-candle-section{background:linear-gradient(135deg,rgba(80,0,30,.4),rgba(30,0,60,.35));",
      "border:1px solid rgba(255,215,0,.15);border-radius:24px;padding:32px 20px;margin-bottom:20px;text-align:center;position:relative;overflow:hidden}",
      ".anni-candle-scene{position:relative;width:100%;min-height:200px;display:flex;flex-direction:column;align-items:center;justify-content:center}",
      ".anni-candle-body{position:relative;width:60px;height:100px;background:linear-gradient(180deg,#fff5e6,#f5d6b8);",
      "border-radius:8px 8px 4px 4px;box-shadow:0 4px 20px rgba(255,200,150,.3),inset 0 -8px 12px rgba(0,0,0,.1);z-index:2}",
      ".anni-candle-wax{position:absolute;top:-6px;left:50%;transform:translateX(-50%);",
      "width:16px;height:12px;background:linear-gradient(180deg,#fff5e6,#f5d6b8);border-radius:3px 3px 0 0;box-shadow:0 -2px 6px rgba(255,200,150,.4)}",
      ".anni-candle-wick{position:absolute;top:-14px;left:50%;transform:translateX(-50%);",
      "width:2px;height:10px;background:#555;border-radius:1px;z-index:3}",
      ".anni-flame{position:absolute;top:-36px;left:50%;transform:translateX(-50%);",
      "width:18px;height:28px;background:radial-gradient(ellipse at 50% 100%,#ffd700 0%,#ff8c00 40%,#ff4500 70%,transparent 100%);",
      "border-radius:50% 50% 50% 50% / 60% 60% 40% 40%;z-index:4;",
      "animation:anniFlameFlicker .3s ease-in-out infinite alternate;",
      "box-shadow:0 0 30px rgba(255,200,0,.6),0 0 60px rgba(255,100,0,.3),0 0 100px rgba(255,50,0,.15)}",
      "@keyframes anniFlameFlicker{0%{transform:translateX(-50%) scale(1) rotate(-1deg)}25%{transform:translateX(-48%) scale(1.04) rotate(1deg)}",
      "50%{transform:translateX(-52%) scale(.96) rotate(-.5deg)}75%{transform:translateX(-49%) scale(1.02) rotate(.5deg)}",
      "100%{transform:translateX(-50%) scale(.98) rotate(0)}}",
      ".anni-flame-extinct{opacity:0!important;transform:translateX(-50%) scale(.1)!important;transition:all .8s ease!important}",
      ".anni-candle-smoke{position:absolute;top:-50px;left:50%;width:6px;height:6px;background:rgba(200,200,200,.4);border-radius:50%;",
      "opacity:0;pointer-events:none;z-index:5}",
      ".anni-candle-smoke.active{animation:anniSmokeRise 1.2s ease-out forwards}",
      "@keyframes anniSmokeRise{0%{opacity:.6;transform:translateX(-50%) translateY(0) scale(1)}100%{opacity:0;transform:translateX(-60%) translateY(-80px) scale(2)}}",
      ".anni-candle-hint{font-size:.8rem;color:rgba(255,255,255,.5);margin-top:24px;transition:opacity .5s}",
      ".anni-candle-surprise{display:none;flex-direction:column;align-items:center;gap:16px;animation:anniSlideUp .6s ease forwards}",
      ".anni-candle-surprise.show{display:flex}",
      ".anni-candle-surprise h3{font-size:1.5rem;font-weight:800;background:linear-gradient(135deg,#FFD700,#FF6B6B);",
      "-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin:0}",
      ".anni-candle-surprise p{color:rgba(255,255,255,.8);font-size:.95rem;margin:0;max-width:380px;line-height:1.7}",
      ".anni-candle-surprise .anni-candle-hearts{font-size:2rem;animation:anniHeartBeat 1s ease-in-out infinite}",
      ".anni-candle-surprise .anni-candle-btn{background:linear-gradient(135deg,#FFD700,#FF6B6B);border:none;",
      "border-radius:100px;padding:12px 32px;color:#000;font-weight:700;cursor:pointer;font-size:.9rem;font-family:inherit;",
      "box-shadow:0 6px 24px rgba(255,215,0,.3);transition:transform .2s}",
      ".anni-candle-surprise .anni-candle-btn:hover{transform:scale(1.05)}",
      ".anni-candle-blow-btn{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);",
      "border-radius:100px;padding:10px 24px;color:rgba(255,255,255,.7);cursor:pointer;font-size:.85rem;font-family:inherit;",
      "transition:all .3s;margin-top:8px}",
      ".anni-candle-blow-btn:hover{background:rgba(255,255,255,.15);color:#fff}",
      ".anni-candle-blow-btn:disabled{opacity:.4;cursor:not-allowed}",



      /* ── Time Capsule ── */
      ".anni-capsule-section{background:linear-gradient(135deg,rgba(0,40,50,.35),rgba(50,0,40,.35));",
      "border:1px solid rgba(255,215,0,.12);border-radius:24px;padding:24px 20px;margin-bottom:20px;overflow:hidden}",
      ".anni-capsule-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;flex-wrap:wrap;gap:8px}",
      ".anni-capsule-badge{font-size:.68rem;font-weight:700;letter-spacing:.1em;color:#FFD700;",
      "background:rgba(255,215,0,.1);border:1px solid rgba(255,215,0,.25);border-radius:100px;padding:4px 12px}",
      ".anni-capsule-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:20px}",
      "@media(max-width:480px){.anni-capsule-stats{grid-template-columns:repeat(2,1fr)}}",
      ".anni-capsule-stat{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);",
      "border-radius:16px;padding:14px 10px;text-align:center;transition:transform .2s}",
      ".anni-capsule-stat:hover{transform:translateY(-3px)}",
      ".anni-capsule-stat-num{font-size:1.6rem;font-weight:800;",
      "background:linear-gradient(135deg,#FFD700,#FF6B6B);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;line-height:1.2}",
      ".anni-capsule-stat-lbl{font-size:.65rem;text-transform:uppercase;letter-spacing:.08em;color:rgba(255,255,255,.5);margin-top:4px}",
      ".anni-capsule-stat-icon{font-size:1.2rem;margin-bottom:4px}",
      ".anni-capsule-months{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}",
      "@media(max-width:480px){.anni-capsule-months{grid-template-columns:repeat(3,1fr)}}",
      ".anni-capsule-month{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.06);",
      "border-radius:12px;padding:12px 6px;text-align:center;transition:all .2s;cursor:default}",
      ".anni-capsule-month:hover{background:rgba(255,255,255,.08);transform:translateY(-2px)}",
      ".anni-capsule-month-name{font-size:.7rem;font-weight:600;color:rgba(255,255,255,.7);margin-bottom:4px;text-transform:capitalize}",
      ".anni-capsule-month-dot{width:8px;height:8px;border-radius:50%;margin:0 auto 4px;display:block}",
      ".anni-capsule-month-count{font-size:.8rem;font-weight:700;color:#FFD700}",
      ".anni-capsule-note{font-size:.78rem;color:rgba(255,255,255,.45);text-align:center;margin-top:18px;font-style:italic;line-height:1.6}",
    ].join("");
    document.head.appendChild(style);
  }

  /* ─── ƏSAS EKRANA GERİ SAYIM (YALNIZ 1 AY QALMIŞ) ──────── */
  function injectMainScreenCountdown() {
    let placeholder = document.getElementById("main-screen-anni-placeholder");
    if (!placeholder) return;

    let diff = ANNIVERSARY_DATE - new Date();
    let daysLeft = Math.floor(diff / 86400000);
    
    // Yalnız 30 gün və ya daha az qalıbsa, və ya İl Dönümü günüdürsə göstər
    if (daysLeft > 30 && !isAnniversaryDay()) {
      return; 
    }

    let completed = getAnniversaryYearsCompleted();
    let yearsNum = isAnniversaryDay() ? completed : completed + 1;
    let yearsOrd = yearsNum + ". İl";

    placeholder.innerHTML =
      '<div class="anni-hero-section" style="margin-bottom:24px;">' +
        '<div class="anni-hero-orbs">' +
          '<div class="anni-orb anni-orb-1"></div>' +
          '<div class="anni-orb anni-orb-2"></div>' +
          '<div class="anni-orb anni-orb-3"></div>' +
        '</div>' +
        '<div class="anni-hero-inner">' +
          '<div class="anni-hero-badge"><span class="anni-badge-sparkle"><i class="fa-solid fa-sparkles"></i></span><span>İL DÖNÜMÜ</span><span class="anni-badge-sparkle"><i class="fa-solid fa-sparkles"></i></span></div>' +
          '<h2 class="anni-hero-title">Hüseyn <span class="anni-hero-amp">&amp;</span> Cəmalə</h2>' +
          '<p class="anni-hero-sub">' + yearsOrd + ' Dönümünə Geri Sayım <i class="fa-solid fa-ring"></i></p>' +
          '<div id="main-anni-display" class="anni-display">' +
            '<div class="anni-time-block"><span class="anni-num" id="main-anni-days">--</span><label>Gün</label></div>' +
            '<div class="anni-sep">:</div>' +
            '<div class="anni-time-block"><span class="anni-num" id="main-anni-hours">--</span><label>Saat</label></div>' +
            '<div class="anni-sep">:</div>' +
            '<div class="anni-time-block"><span class="anni-num" id="main-anni-mins">--</span><label>Dəqiqə</label></div>' +
            '<div class="anni-sep">:</div>' +
            '<div class="anni-time-block"><span class="anni-num" id="main-anni-secs">--</span><label>Saniyə</label></div>' +
          '</div>' +
          '<p id="main-anni-arrived-msg" class="anni-arrived-msg anni-hidden"><i class="fa-solid fa-party-horn"></i> ' + yearsOrd + ' İL TAMAM OLDU! <i class="fa-solid fa-champagne-glasses"></i></p>' +
          '<div class="anni-hero-hearts">' +
            '<span class="anni-h1"><i class="fa-solid fa-heart" style="color:#ff4d6d"></i></span>' +
            '<span class="anni-h2"><i class="fa-solid fa-heart" style="color:#ff4d6d"></i></span>' +
            '<span class="anni-h3"><i class="fa-solid fa-heart" style="color:#ff4d6d"></i></span>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  /* ─── İL DÖNÜMÜ MODAL BİLDİRİŞİ (son 7 gün, şifrə ilə daxil olandan sonra) ─── */
  function showAnniversaryCountdownModal() {
    if (window.anniCountdownModalShown) return;

    let now = new Date();
    let yr = now.getFullYear();
    let candidate = new Date(yr, 7, 3, 0, 0, 0);
    if (candidate <= now) candidate = new Date(yr + 1, 7, 3, 0, 0, 0);
    let daysLeft = Math.ceil((candidate - now) / 86400000);

    if (daysLeft < 1 || daysLeft > 7) return;
    if (localStorage.getItem("anni_notif_dismissed") === now.toDateString()) return;
    window.anniCountdownModalShown = true;

    let ov = document.createElement("div");
    ov.className = "anni-modal-overlay";
    ov.id = "anni-countdown-modal";
    ov.innerHTML =
      '<div class="anni-modal-card">' +
        '<div class="anni-modal-icon">' + (daysLeft === 1 ? '🥂' : '🎉') + '</div>' +
        '<div class="anni-modal-badge">İL DÖNÜMÜ</div>' +
        '<h3 class="anni-modal-title">' +
          (daysLeft === 1
            ? 'Sabah <strong>İl Dönümümüzdür</strong>!'
            : 'İl Dönümümüzə <strong>' + daysLeft + '</strong> gün qaldı!') +
        '</h3>' +
        '<p class="anni-modal-text">SSəbrsizliklə gözləyirəm, Hərşeyim🤍</p>' +
        '<div class="anni-modal-hearts"><i class="fa-solid fa-heart" style="color:#ff4d6d"></i><i class="fa-solid fa-heart" style="color:#ff4d6d"></i><i class="fa-solid fa-heart" style="color:#ff4d6d"></i></div>' +
        '<div class="anni-modal-actions">' +
          '<button class="anni-modal-close" id="anni-modal-close"><i class="fa-solid fa-heart"></i> Bağla</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(ov);

    function dismiss() {
      localStorage.setItem("anni_notif_dismissed", now.toDateString());
      ov.style.transition = "opacity .35s ease";
      ov.style.opacity = "0";
      setTimeout(function () { ov.remove(); }, 350);
    }

    document.getElementById("anni-modal-close").addEventListener("click", dismiss);
    ov.addEventListener("click", function (e) { if (e.target === ov) dismiss(); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && document.getElementById("anni-countdown-modal")) dismiss();
    });
  }

  window.showAnniversaryCountdownModal = showAnniversaryCountdownModal;

  /* ─── XATİRƏ SLAYDŞOu ───────────────────────────────────── */
  function initAnniSlideshow() {
    let viewport = document.getElementById("anni-slide-viewport");
    if (!viewport) return;

    // Şəkilləri window.allImages-dan götür (qalereya ilə eyni mənbə)
    // Yüklənməmişsə, GitHub API-dən özümüz çəkirik
    function startSlideshow(images) {
      if (!images || images.length === 0) {
        viewport.innerHTML = '<div class="anni-slide-loading"><i class="fa-solid fa-heart-crack"></i><span>Şəkil tapılmadı</span></div>';
        return;
      }

      let slides = images.map(function(img) {
        return typeof img === "string" ? img : (img.download_url || img.url || img);
      }).filter(Boolean);

      let current = 0;
      let total = slides.length;
      let isPlaying = true;
      let progressTimer = null;
      let progressStart = null;
      let DURATION = 4000; // hər şəkil 4 saniyə
      let preloaded = {};

      let counter = document.getElementById("anni-slide-counter");
      let fill = document.getElementById("anni-progress-fill");
      let playBtn = document.getElementById("anni-slide-play");
      let prevBtn = document.getElementById("anni-slide-prev");
      let nextBtn = document.getElementById("anni-slide-next");

      // Viewport-u təmizlə, 2 layer yaradaq (crossfade üçün)
      viewport.innerHTML = '<div class="anni-layer anni-layer-a"></div><div class="anni-layer anni-layer-b anni-layer-hidden"></div>';
      let layerA = viewport.querySelector(".anni-layer-a");
      let layerB = viewport.querySelector(".anni-layer-b");
      let activeLayer = layerA;
      let inactiveLayer = layerB;

      function preload(idx) {
        if (preloaded[idx]) return;
        preloaded[idx] = true;
        let img = new Image();
        img.src = slides[idx];
      }

      function setSlide(idx, dir) {
        current = ((idx % total) + total) % total;
        let url = slides[current];

        // Növbəti + əvvəlkini preload et
        preload((current + 1) % total);
        preload((current - 1 + total) % total);

        // Ken Burns effekti üçün random istiqamət
        let kbVariants = [
          "anni-kb-1", "anni-kb-2", "anni-kb-3", "anni-kb-4"
        ];
        let kb = kbVariants[Math.floor(Math.random() * kbVariants.length)];

        // Yeni layer-i hazırla
        inactiveLayer.style.backgroundImage = "url('" + url + "')";
        inactiveLayer.className = "anni-layer " + kb;
        // Crossfade
        inactiveLayer.classList.remove("anni-layer-hidden");
        activeLayer.classList.add("anni-layer-hidden");

        // Layer-ları dəyişdir
        let tmp = activeLayer;
        activeLayer = inactiveLayer;
        inactiveLayer = tmp;

        // Counter
        if (counter) counter.textContent = (current + 1) + " / " + total;

        // Progress sıfırla
        resetProgress();
      }

      function resetProgress() {
        if (fill) {
          fill.style.transition = "none";
          fill.style.width = "0%";
          void fill.offsetWidth;
        }
        if (progressTimer) { clearTimeout(progressTimer); progressTimer = null; }
        if (isPlaying) startProgress();
      }

      function startProgress() {
        if (!isPlaying) return;
        progressStart = Date.now();
        if (fill) {
          fill.style.transition = "width " + DURATION + "ms linear";
          fill.style.width = "100%";
        }
        progressTimer = setTimeout(function() {
          setSlide(current + 1);
        }, DURATION);
      }

      function pauseProgress() {
        if (progressTimer) { clearTimeout(progressTimer); progressTimer = null; }
        if (fill) {
          let elapsed = Date.now() - (progressStart || Date.now());
          let pct = Math.min(elapsed / DURATION * 100, 100);
          fill.style.transition = "none";
          fill.style.width = pct + "%";
        }
      }

      if (playBtn) {
        playBtn.addEventListener("click", function() {
          isPlaying = !isPlaying;
          let icon = playBtn.querySelector("i");
          if (isPlaying) {
            icon.className = "fa-solid fa-pause";
            startProgress();
          } else {
            icon.className = "fa-solid fa-play";
            pauseProgress();
          }
        });
      }
      if (prevBtn) prevBtn.addEventListener("click", function() { setSlide(current - 1); });
      if (nextBtn) nextBtn.addEventListener("click", function() { setSlide(current + 1); });

      // İlk şəkili göstər
      preload(0);
      preload(1);
      setSlide(0);
    }

    // window.allImages artıq varsa istifadə et, yoxdursa API-dən çək
    if (window.allImages && window.allImages.length > 0) {
      startSlideshow(window.allImages);
    } else {
      // Qalereya hələ yüklənməyibsə — GitHub API-dən çək
      let apiUrl = "/.netlify/functions/github-content?path=gallery";
      fetch(apiUrl)
        .then(function(r) { return r.json(); })
        .then(function(data) {
          if (!Array.isArray(data)) { startSlideshow([]); return; }
          let imgs = data
            .filter(function(f) { return /\.(jpg|jpeg|png|webp|gif)$/i.test(f.name); })
            .sort(function(a, b) { return new Date(a.git_date || 0) - new Date(b.git_date || 0); });
          startSlideshow(imgs);
        })
        .catch(function() { startSlideshow([]); });
    }
  }

  /* Ana səhifəyə / İl dönümü nav düyməsinə müdaxilə etmək (istifadəçi istəyi):
     "navbarda o yer sadece il donumu gunleri acilsin"
   */
  function patchNavbarForAnniversary() {
    let navBtn = document.querySelector('button[data-page="anniversary"]');
    if (!navBtn) return;

    if (isAnniversaryDay()) {
      navBtn.style.display = "";
      navBtn.style.animation = "anniSparkle 2s infinite";
    } else {
      navBtn.style.display = "none";
    }
  }

  /* ─── VIRTUAL CANDLE ────────────────────────────────────── */
  let anniCandleBlown = false;
  let anniCandleAudioCtx = null;
  let anniCandleAnalyser = null;
  let anniCandleMediaStream = null;
  let anniCandleAnimFrame = null;

  function initVirtualCandle() {
    let scene = document.getElementById("anni-candle-scene");
    let flame = document.getElementById("anni-flame");
    let hint = document.getElementById("anni-candle-hint");
    let surprise = document.getElementById("anni-candle-surprise");
    let blowBtn = document.getElementById("anni-candle-blow-btn");
    let reloadBtn = document.getElementById("anni-candle-reload");
    if (!scene || !flame) return;

    function blowCandle() {
      if (anniCandleBlown) return;
      anniCandleBlown = true;
      if (anniCandleAnimFrame) { cancelAnimationFrame(anniCandleAnimFrame); anniCandleAnimFrame = null; }
      if (anniCandleAudioCtx) { anniCandleAudioCtx.close(); anniCandleAudioCtx = null; }
      if (anniCandleMediaStream) { anniCandleMediaStream.getTracks().forEach(function(t){t.stop()}); anniCandleMediaStream = null; }

      flame.classList.add("anni-flame-extinct");

      let smoke = document.getElementById("anni-candle-smoke");
      if (smoke) { smoke.classList.add("active"); }

      if (hint) hint.style.opacity = "0";
      if (blowBtn) blowBtn.style.display = "none";

      setTimeout(function () {
        if (surprise) surprise.classList.add("show");
        if (hint) hint.style.display = "none";
        if (smoke) { smoke.classList.remove("active"); smoke.style.display = "none"; }
      }, 1000);
    }

    function resetCandle() {
      anniCandleBlown = false;
      flame.classList.remove("anni-flame-extinct");
      if (surprise) surprise.classList.remove("show");
      if (hint) { hint.style.display = ""; hint.style.opacity = "1"; }
      if (blowBtn) blowBtn.style.display = "";
      let smoke = document.getElementById("anni-candle-smoke");
      if (smoke) { smoke.style.display = ""; smoke.classList.remove("active"); }
    }

    if (reloadBtn) {
      reloadBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        resetCandle();
      });
    }

    if (blowBtn) {
      blowBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        startCandleMicListening(blowCandle, blowBtn);
      });
    }
  }

  function startCandleMicListening(onBlow, btn) {
    if (anniCandleMediaStream) return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      if (btn) btn.textContent = "Mikrofon dəstəklənmir";
      return;
    }

    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Mikrofon açılır...';

    navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      .then(function (stream) {
        anniCandleMediaStream = stream;
        anniCandleAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
        anniCandleAnalyser = anniCandleAudioCtx.createAnalyser();
        anniCandleAnalyser.fftSize = 256;
        let source = anniCandleAudioCtx.createMediaStreamSource(stream);
        source.connect(anniCandleAnalyser);

        btn.innerHTML = '<i class="fa-solid fa-ear-listen"></i> Dinlənir... Üfür!';
        btn.style.background = "rgba(0,200,100,.15)";
        btn.style.borderColor = "rgba(0,200,100,.4)";

        let dataArray = new Uint8Array(anniCandleAnalyser.frequencyBinCount);
        let blowThreshold = 60;
        let consecutiveHigh = 0;

        function detectBlow() {
          if (anniCandleBlown || !anniCandleAnalyser) return;
          anniCandleAnalyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
          let avg = sum / dataArray.length;

          if (avg > blowThreshold) {
            consecutiveHigh++;
            if (consecutiveHigh > 3) {
              onBlow();
              btn.innerHTML = '<i class="fa-solid fa-check"></i> Üfürüldü!';
              return;
            }
          } else {
            consecutiveHigh = Math.max(0, consecutiveHigh - 1);
          }
          if (!anniCandleBlown) anniCandleAnimFrame = requestAnimationFrame(detectBlow);
        }
        detectBlow();
      })
      .catch(function (err) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-microphone-slash"></i> ' + (err.name === "NotAllowedError" ? "İcazə verilmədi" : "Xəta baş verdi");
        console.warn("Candle mic error:", err);
      });
  }



  /* ─── TIME CAPSULE ──────────────────────────────────────── */
  function initTimeCapsule(retries) {
    if (retries === undefined) retries = 0;
    if (retries > 15) return;

    let notesEl = document.getElementById("capsule-notes");
    let filmsEl = document.getElementById("capsule-films");
    let photosEl = document.getElementById("capsule-photos");
    let yearEl = document.getElementById("anni-capsule-year");
    let monthsEl = document.getElementById("anni-capsule-months");
    let noteEl = document.getElementById("anni-capsule-note");
    if (!notesEl || !filmsEl || !photosEl) return;

    let photos = Array.isArray(window.allImages) ? window.allImages.length : 0;
    let notes = Array.isArray(window.currentNotes) ? window.currentNotes.length : 0;
    let films = Array.isArray(window.currentFilms) ? window.currentFilms.length : 0;

    if (notes === 0 || films === 0) {
      setTimeout(function () { initTimeCapsule(retries + 1); }, 1500);
      return;
    }

    /* Real şəkil sayını əldə etmək üçün slideshow-un yüklənməsini gözlə */
    if (photos === 0 && window.allImages) {
      setTimeout(function () { initTimeCapsule(retries + 1); }, 1500);
      return;
    }

    let yr = RELATIONSHIP_START.getFullYear() + Math.max(1, getAnniversaryYearsCompleted());
    if (yearEl) yearEl.textContent = (yr - 1) + " → " + yr;

    if (photosEl) animateCount(photosEl, 0, photos, 1500);
    if (notesEl) animateCount(notesEl, 0, notes, 1500);
    if (filmsEl) animateCount(filmsEl, 0, films, 1500);

    if (monthsEl) {
      let aylar = ["Yanvar","Fevral","Mart","Aprel","May","İyun","İyul","Avqust","Sentyabr","Oktyabr","Noyabr","Dekabr"];
      let monthBuckets = {};
      window._anniMonthItems = {};
      for (let i = 0; i < 12; i++) {
        monthBuckets[i] = { notes: 0, films: 0, photos: 0 };
        window._anniMonthItems[i] = [];
      }

      window.currentNotes.forEach(function (n) {
        let d = new Date(n.dateIso);
        if (!isNaN(d.getTime()) && d.getFullYear() >= RELATIONSHIP_START.getFullYear()) {
          let m = d.getMonth();
          monthBuckets[m].notes++;
          window._anniMonthItems[m].push({ type: 'note', data: n });
        }
      });

      window.currentFilms.forEach(function (f) {
        let d = new Date(f.watchDate || f.dateIso);
        if (!isNaN(d.getTime()) && d.getFullYear() >= RELATIONSHIP_START.getFullYear()) {
          let m = d.getMonth();
          monthBuckets[m].films++;
          window._anniMonthItems[m].push({ type: 'film', data: f });
        }
      });

      if (Array.isArray(window.allImages)) {
        window.allImages.forEach(function (img) {
          let dateStr = img.git_date || img.name || img.download_url;
          if (dateStr) {
            let d = new Date(dateStr);
            if (!isNaN(d.getTime()) && d.getFullYear() >= RELATIONSHIP_START.getFullYear()) {
              let m = d.getMonth();
              monthBuckets[m].photos++;
              window._anniMonthItems[m].push({ type: 'photo', data: img });
            } else if (typeof dateStr === "string") {
              let parts = dateStr.match(/(\d{4})-(\d{2})/);
              if (parts) {
                let m = parseInt(parts[2], 10) - 1;
                if (m >= 0 && m < 12) {
                  monthBuckets[m].photos++;
                  window._anniMonthItems[m].push({ type: 'photo', data: img });
                }
              }
            }
          }
        });
        let totalWithDate = 0;
        for (let mi = 0; mi < 12; mi++) totalWithDate += monthBuckets[mi].photos;
        if (totalWithDate === 0 && window.allImages.length > 0) {
          let now = new Date();
          monthBuckets[now.getMonth()].photos = window.allImages.length;
          window.allImages.forEach(function (img) {
            window._anniMonthItems[now.getMonth()].push({ type: 'photo', data: img });
          });
        }
      }

      let html = "";
      let totalActivity = 0;
      for (let i = 0; i < 12; i++) totalActivity += monthBuckets[i].notes + monthBuckets[i].films + monthBuckets[i].photos;
      let maxAct = 1;
      for (let i = 0; i < 12; i++) {
        let act = monthBuckets[i].notes + monthBuckets[i].films + monthBuckets[i].photos;
        if (act > maxAct) maxAct = act;
      }

      for (let i = 0; i < 12; i++) {
        let act = monthBuckets[i].notes + monthBuckets[i].films + monthBuckets[i].photos;
        let intensity = act / maxAct;
        let dotColor = intensity > 0.5 ? "#FFD700" : intensity > 0.2 ? "#FF6B6B" : "rgba(255,255,255,.12)";
        let barH = Math.max(4, Math.round(intensity * 20));
        html += '<div class="anni-capsule-month" data-ay="'+i+'"><span class="anni-capsule-month-dot" style="background:' + dotColor + ';width:' + barH + 'px;height:' + barH + 'px"></span><div class="anni-capsule-month-name">' + aylar[i] + '</div><div class="anni-capsule-month-count">' + (act > 0 ? act + ' ✨' : '-') + '</div></div>';
      }
      monthsEl.innerHTML = html;

      monthsEl.querySelectorAll('.anni-capsule-month').forEach(function (card) {
        card.style.cursor = 'pointer';
        card.addEventListener('click', function () {
          let ay = parseInt(this.getAttribute('data-ay'));
          window.openAnniCapsuleModal(ay);
        });
      });
    }

    let capsuleNotes = [
      "İl ərzində hər an səninlə xatirələr yığdıq. " + notes + " not, " + films + " film, " + photos + " şəkil — hər biri bir parça sən.",
      "Bir ilə nələr sığdı... " + notes + " not, " + films + " film, " + photos + " şəkil. Gülüşlər, sözlər, baxışlar. Hamısı qəlbimdə ən qiymətli xəzinə.",
      "Zaman necə də sürətli keçir. " + photos + " şəkil, " + films + " film, " + notes + " not — hər biri bir xatirə. Sanki dünən idi ilk görüşümüz.",
      "Birgə izlədiyimiz " + films + " film, yazdığımız " + notes + " not, çəkdiyimiz " + photos + " şəkil... Hamısı bir ilin hekayəsidir. Bizim hekayəmiz."
    ];
    if (noteEl) noteEl.textContent = capsuleNotes[Math.floor(Math.random() * capsuleNotes.length)];
  }

  window.openAnniCapsuleModal = function (monthIndex) {
    let items = window._anniMonthItems && window._anniMonthItems[monthIndex];
    if (!items || !items.length) return;

    let aylar = ["Yanvar","Fevral","Mart","Aprel","May","İyun","İyul","Avqust","Sentyabr","Oktyabr","Noyabr","Dekabr"];
    let modal = document.getElementById('timecapsule-modal');
    if (!modal) return;

    document.getElementById('capsule-modal-title').textContent = aylar[monthIndex];

    let sorted = items.slice().sort(function (a, b) {
      let da = a.data.git_date || a.data.dateIso || a.data.watchDate || 0;
      let db = b.data.git_date || b.data.dateIso || b.data.watchDate || 0;
      return new Date(da) - new Date(db);
    });

    let body = document.getElementById('capsule-modal-body');
    window._capsuleItems = sorted;
    let html = '';

    sorted.forEach(function (item, idx) {
      if (item.type === 'photo') {
        let d = typeof parseImageDate === 'function' ? parseImageDate(item.data) : null;
        let dateStr = (d && typeof formatAzDate === 'function') ? formatAzDate(d) : (item.data.git_date || '');
        html += '<div class="capsule-item capsule-photo-item" data-ci="'+idx+'" onclick="window.openLightbox(window.allImages.indexOf(window._capsuleItems[this.dataset.ci].data))">' +
          '<img src="'+item.data.download_url+'" loading="lazy" alt="Şəkil" />' +
          '<div class="capsule-item-info">' +
          '<span class="capsule-item-date"><i class="far fa-clock"></i> '+dateStr+'</span>' +
          '<span class="capsule-item-tag"><i class="fas fa-image"></i> Şəkil</span>' +
          '</div></div>';
      } else if (item.type === 'note') {
        html += '<div class="capsule-item capsule-note-item" data-ci="'+idx+'" onclick="window.showNote(window.currentNotes.indexOf(window._capsuleItems[this.dataset.ci].data))">' +
          '<div class="capsule-item-icon"><i class="fas fa-sticky-note"></i></div>' +
          '<div class="capsule-item-info">' +
          '<strong class="capsule-item-title">'+item.data.title+'</strong>' +
          '<span class="capsule-item-date"><i class="far fa-clock"></i> '+item.data.dateStr+'</span>' +
          '<p class="capsule-item-desc">'+(item.data.content || '').substring(0, 80)+((item.data.content || '').length > 80 ? '...' : '')+'</p>' +
          '</div></div>';
      } else if (item.type === 'film') {
        html += '<div class="capsule-item capsule-film-item" data-ci="'+idx+'" onclick="window.showFilm(window._capsuleItems[this.dataset.ci].data)">' +
          '<div class="capsule-item-icon"><i class="fas fa-clapperboard"></i></div>' +
          '<div class="capsule-item-info">' +
          '<strong class="capsule-item-title">'+item.data.title+'</strong>' +
          '<span class="capsule-item-date"><i class="far fa-clock"></i> '+(typeof formatFilmDate === 'function' ? formatFilmDate(item.data.watchDate || item.data.dateIso) : '')+'</span>' +
          '<span class="capsule-film-rating"><i class="fas fa-star"></i> '+(item.data.rating || '-')+'/10</span>' +
          '</div></div>';
      }
    });

    body.innerHTML = html;
    modal.classList.remove('hidden');
    modal.style.display = "flex";
  };

  function animateCount(el, start, end, duration) {
    let range = end - start;
    let startTime = null;
    function step(ts) {
      if (!startTime) startTime = ts;
      let progress = Math.min((ts - startTime) / duration, 1);
      let eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(start + range * eased);
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* ─── SÖZ BULUDU ────────────────────────────────────────── */
  let CLOUD_STOP_WORDS = new Set([
    "üçün","bir","və","bu","o","ki","ilə","kimi","daha","çox","mən","sən","məni","səni",
    "mənim","sənin","mənə","sənə","məndə","səndə","məndən","səndən","olan","olmaq","oldu",
    "olur","olub","olacaq","idi","imiş","deyil","yox","hər","bütün","heç","sonra","əvvəl",
    "qədər","öz","özüm","özün","özünü","özümü","onun","ona","onu","ondan","onunla","biz",
    "bizim","siz","sizin","onlar","onların","amma","lakin","çünki","ancaq","belə","elə",
    "necə","nə","nəyə","neçə","indi","artıq","yenə","həmişə","hərdən","bəzən","deyə",
    "edir","edirəm","edirsən","etmək","gün","gündə","həftə","il","ildə","ay","ayda","saat",
    "dəfə","ilk","son","birlikdə","birlikdəyik","birlikdəyəm","səninlə","mənimlə","sənsiz",
    "mənsiz","qədər","başqa","özümüzə","özümüzdə","üçüncü","birinci","ikinci","üçüncü",
    "sevgi","sevə","sevirəm","sevir","sənin","səni","sənsiz","məni","mən","sən"
  ]);

  function initWordCloud(retries) {
    if (retries === undefined) retries = 0;
    if (retries > 25) return;
    let container = document.getElementById("anni-wordcloud");
    if (!container) return;
    if (!Array.isArray(window.currentNotes) || window.currentNotes.length === 0) {
      setTimeout(function () { initWordCloud(retries + 1); }, 1500);
      return;
    }
    buildWordCloud(container);
  }

  function buildWordCloud(container) {
    let text = "";
    (window.currentNotes || []).forEach(function (n) {
      if (n.title) text += " " + n.title;
      if (n.content) text += " " + n.content;
    });

    let freq = {};
    let tokens = text.toLowerCase().match(/[a-zçəğıöşü]+/g) || [];
    tokens.forEach(function (w) {
      if (w.length < 3 || CLOUD_STOP_WORDS.has(w)) return;
      freq[w] = (freq[w] || 0) + 1;
    });

    let top = Object.keys(freq)
      .map(function (w) { return { text: w, count: freq[w] }; })
      .sort(function (a, b) { return b.count - a.count; })
      .slice(0, 34);

    if (top.length === 0) {
      container.innerHTML =
        '<div class="anni-cloud-empty"><i class="fa-solid fa-heart-crack"></i> Hələ ki, bulud üçün söz yığılmayıb</div>';
      return;
    }

    let maxC = top[0].count;
    let W = container.clientWidth || 600;
    let H = container.clientHeight || 420;
    let scale = Math.min((W * 0.92) / 32, (H * 0.94) / 22);
    let cx = W / 2;
    let cy = H / 2 + 6 * scale;
    let palette = ["#FFD700", "#FF6B6B", "#FF69B4", "#FFA500", "#FFE4B5", "#FF8C69"];
    let placed = [];
    let placedCount = 0;

    top.forEach(function (w) {
      let size = 13 + (w.count / maxC) * 25;
      let estW = w.text.length * size * 0.62;
      let estH = size * 1.2;
      let ok = false;
      for (let a = 0; a < 80 && !ok; a++) {
        let t = Math.random() * Math.PI * 2;
        let r = Math.sqrt(Math.random()) * 0.95;
        let s = Math.sin(t);
        let hx = 16 * s * s * s;
        let hy = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
        let px = cx + hx * r * scale;
        let py = cy - hy * r * scale;
        ok = true;
        for (let i = 0; i < placed.length; i++) {
          let p = placed[i];
          if (Math.abs(px - p.x) < (estW + p.w) / 2 + 2 &&
              Math.abs(py - p.y) < (estH + p.h) / 2 + 2) {
            ok = false;
            break;
          }
        }
        if (ok) {
          let rot = (Math.random() * 24 - 12).toFixed(1);
          let el = document.createElement("span");
          el.className = "anni-cloud-word";
          el.textContent = w.text;
          el.title = w.text + " — " + w.count + " dəfə";
          el.style.cssText =
            "left:" + (px - estW / 2).toFixed(0) + "px;" +
            "top:" + (py - estH / 2).toFixed(0) + "px;" +
            "font-size:" + size.toFixed(1) + "px;" +
            "color:" + palette[Math.floor(Math.random() * palette.length)] + ";" +
            "--anni-rot:" + rot + "deg;";
          container.appendChild(el);
          placed.push({ x: px, y: py, w: estW, h: estH });
          placedCount++;
        }
      }
    });

    if (placedCount === 0) {
      container.innerHTML =
        '<div class="anni-cloud-empty"><i class="fa-solid fa-heart-crack"></i> Sözləri yerləşdirmək mümkün olmadı</div>';
    }
  }

  /* ─── TEST REJİMİ (telefon üçün) ────────────────────────── */
  function isTestMode() {
    return window.location.search.indexOf("il_donumu=test") > -1 ||
           window.location.search.indexOf("anni=test") > -1;
  }

  function triggerAnniversaryTest() {
    let navBtn = document.querySelector('button[data-page="anniversary"]');
    if (navBtn) navBtn.click();
    setTimeout(function () {
      let disp = document.getElementById("anni-display");
      let arr = document.getElementById("anni-arrived-msg");
      if (disp) disp.style.display = "none";
      if (arr) arr.classList.remove("anni-hidden");
      showAnniversaryScreen();
      setTimeout(launchConfetti, 1000);
    }, 300);
  }

  function setupMobileTestTrigger() {
    /* Hero badge-a 5 dəfə sürətli toxunma */
    let tapCount = 0;
    let tapTimer = null;
    document.addEventListener("click", function (e) {
      let badge = e.target.closest(".anni-hero-badge, .welcome-badge, .anni-hero-title");
      if (!badge) return;
      tapCount++;
      if (tapTimer) clearTimeout(tapTimer);
      tapTimer = setTimeout(function () { tapCount = 0; }, 800);
      if (tapCount >= 5) {
        tapCount = 0;
        triggerAnniversaryTest();
      }
    });

  }

  /* ─── ANA BAŞLATMA ──────────────────────────────────────── */
  function init() {
    injectStyles();
    injectCountdownWidget();
    injectMainScreenCountdown();
    patchDailyMessage();
    setTimeout(initAnniSlideshow, 300);
    setTimeout(initTimeCapsule, 600);
    setTimeout(initVirtualCandle, 400);
    setTimeout(initWordCloud, 800);

    document.getElementById('close-capsule-btn')?.addEventListener('click', function () {
      let modal = document.getElementById('timecapsule-modal');
      if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
      }
    });

    /* Ctrl+Shift+Y — test qısayolu (desktop) */
    document.addEventListener("keydown", function (e) {
      if (e.ctrlKey && e.shiftKey && (e.key.toLowerCase() === "y" || e.key === "Y")) {
        e.preventDefault();
        triggerAnniversaryTest();
      }
    });

    /* URL parametri: ?il_donumu=test və ya ?anni=test (telefon) */
    if (isTestMode()) {
      setTimeout(triggerAnniversaryTest, 500);
    }

    /* Mobil üçün gizli test: hero badge-a 5 toxunma */
    setTimeout(setupMobileTestTrigger, 1000);

    if (isAnniversaryDay()) {
      showAnniversaryScreen();
      setTimeout(launchConfetti, 1000);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function() {
      init();
      patchNavbarForAnniversary();
    });
  } else {
    init();
    patchNavbarForAnniversary();
  }
})();
