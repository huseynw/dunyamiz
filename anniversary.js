/* ============================================================
   anniversary.js — Hüseyn & Cəmalə | 3 Avqust 2026 | 1 İL
   ============================================================ */

(function () {
  "use strict";

  /* ─── KONFIQURASIYA ─────────────────────────────────────── */
  var ANNIVERSARY_DATE = new Date("2026-08-03T00:00:00");
  var RELATIONSHIP_START = new Date("2025-08-03T00:00:00");

  /* ─── 365 GÜNLÜK MESAJLAR ───────────────────────────────── */
  var DAILY_MESSAGES = [
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

  var ANNIVERSARY_MESSAGE_365 =
    "Bu gün... bir il tamam oldu. Hüseyn & Cəmalə — 365 gün, 8760 saat, 525,600 dəqiqə sevgi. Hər günü sənlə yaşadım, hər saniyəni sənə bağışladım. Sən mənim ən gözəl xatirəm, ən böyük sevincim, ən qiymətli insanımsan. Bir il keçdi — amma bu yolun sonu yoxdur. Sənlə ömrümün qalan hissəsini də keçirmək istəyirəm. ❤️🎉✨";

  /* ─── YARDIMÇI FUNKSİYALAR ─────────────────────────────── */
  function getDaysSinceStart() {
    return Math.floor((new Date() - RELATIONSHIP_START) / 86400000);
  }

  function getDaysUntilAnniversary() {
    var diff = ANNIVERSARY_DATE - new Date();
    if (diff <= 0) return 0;
    return {
      total: Math.floor(diff / 86400000),
      hours: Math.floor((diff % 86400000) / 3600000),
      minutes: Math.floor((diff % 3600000) / 60000),
      seconds: Math.floor((diff % 60000) / 1000),
    };
  }

  function isAnniversaryDay() {
    var n = new Date();
    return n.getFullYear() === 2026 && n.getMonth() === 7 && n.getDate() === 3;
  }

  function getTodayMessage() {
    var day = getDaysSinceStart();
    if (day <= 0) return null;
    if (day >= 365) return ANNIVERSARY_MESSAGE_365;
    return DAILY_MESSAGES[Math.min(day - 1, DAILY_MESSAGES.length - 1)];
  }

  function getDayLabel() {
    var day = getDaysSinceStart();
    if (day <= 0) return "";
    if (day >= 365) return "365-ci Gün — 1 İl! 🎉";
    return day + "-ci Gün Birlikdə";
  }

  /* ─── GERİ SAYIM WİDGETİ ────────────────────────────────── */
  function injectCountdownWidget() {
    var homePage = document.getElementById("page-anniversary");
    if (!homePage) return;
    var pageContent = homePage.querySelector(".page-content");
    if (!pageContent) return;

    var widget = document.createElement("div");
    widget.id = "anni-countdown-widget";
    widget.className = "anni-countdown-widget";
    widget.innerHTML = '<div class="anni-widget-inner">' +
      '<div class="anni-widget-header">' +
        '<div class="anni-widget-badge"><span class="anni-badge-sparkle">✨</span><span>3 AVQUST 2026</span></div>' +
        '<h3 class="anni-widget-title">1 İllik İl Dönümümüz</h3>' +
        '<p class="anni-widget-sub">Hüseyn &amp; Cəmalə</p>' +
      '</div>' +
      '<div id="anni-display" class="anni-display">' +
        '<div class="anni-time-block"><span class="anni-num" id="anni-days">--</span><label>Gün</label></div>' +
        '<div class="anni-sep">:</div>' +
        '<div class="anni-time-block"><span class="anni-num" id="anni-hours">--</span><label>Saat</label></div>' +
        '<div class="anni-sep">:</div>' +
        '<div class="anni-time-block"><span class="anni-num" id="anni-mins">--</span><label>Dəqiqə</label></div>' +
        '<div class="anni-sep">:</div>' +
        '<div class="anni-time-block"><span class="anni-num" id="anni-secs">--</span><label>Saniyə</label></div>' +
      '</div>' +
      '<p id="anni-arrived-msg" class="anni-arrived-msg anni-hidden">🎉 1 İL TAMAM OLDU! 🎉</p>' +
      '<div class="anni-widget-footer"><div class="anni-heart-dots"><span>❤️</span><span>🥂</span><span>❤️</span></div></div>' +
    '</div>';

    var firstCard = pageContent.querySelector(".time-together-card");
    if (firstCard) {
      pageContent.insertBefore(widget, firstCard);
    } else {
      pageContent.prepend(widget);
    }
    runCountdown();
  }

  function runCountdown() {
    function tick() {
      if (isAnniversaryDay()) {
        var disp = document.getElementById("anni-display");
        var arr = document.getElementById("anni-arrived-msg");
        if (disp) disp.style.display = "none";
        if (arr) arr.classList.remove("anni-hidden");
        return;
      }
      var r = getDaysUntilAnniversary();
      if (!r) return;
      function sv(id, val) {
        var el = document.getElementById(id);
        if (el) el.textContent = String(val).padStart(2, "0");
      }
      sv("anni-days", r.total);
      sv("anni-hours", r.hours);
      sv("anni-mins", r.minutes);
      sv("anni-secs", r.seconds);
    }
    tick();
    setInterval(tick, 1000);
  }

  /* ─── GÜN MESAJINI YENILƏ ──────────────────────────────── */
  function patchDailyMessage() {
    var msg = getTodayMessage();
    if (!msg) return;
    var t = document.getElementById("daily-message-text");
    var ti = document.getElementById("daily-message-title");
    var d = document.getElementById("daily-message-date");
    if (t) t.textContent = msg;
    if (ti) ti.innerHTML = getDayLabel() + ' <i class="fas fa-heart"></i>';
    if (d) {
      var fmt = new Date().toLocaleDateString("az-AZ", { day: "numeric", month: "long", year: "numeric" });
      d.innerHTML = '<i class="fas fa-calendar-day"></i> ' + fmt;
    }
  }

  /* ─── TAM EKRAN İL DÖNÜMÜ ───────────────────────────────── */
  function showAnniversaryScreen() {
    var screen = document.getElementById("anniversary-screen");
    if (!screen) return;

    screen.innerHTML =
      '<canvas id="anni-canvas" class="anni-canvas"></canvas>' +
      '<div class="anni-content"><div class="anni-content-inner">' +
        '<div class="anni-badge-top">Hüseyn &amp; Cəmalə ❤️</div>' +
        '<div class="anni-year-display"><div class="anni-year-ring"><div class="anni-year-core">' +
          '<span class="anni-year-num">1</span><span class="anni-year-text">İL</span>' +
        '</div></div></div>' +
        '<h2 class="anni-headline">Bir il əvvəl iki ayrı dünya vardı —<br><span class="anni-headline-gold">İndi bir dünyamız var.</span></h2>' +
        '<p class="anni-sub-quote">"365 gün, 8760 saat, 525,600 dəqiqə — hər saniyəni sənlə yaşadım ki, bu günü yaşaya bilim. <strong>Sənin il dönümündür, Cəmalə. ❤️</strong>"</p>' +
        '<div class="anni-stats-row">' +
          '<div class="anni-stat"><strong>365</strong><span>Gün</span></div>' +
          '<div class="anni-stat-div">💕</div>' +
          '<div class="anni-stat"><strong>8,760</strong><span>Saat</span></div>' +
          '<div class="anni-stat-div">💕</div>' +
          '<div class="anni-stat"><strong>∞</strong><span>Sevgi</span></div>' +
        '</div>' +
        '<button id="anni-enter-btn" class="anni-enter-btn"><span>Dünyamıza Gir</span> <i class="fas fa-heart"></i></button>' +
      '</div></div>';

    screen.style.display = "flex";
    requestAnimationFrame(function() { initFireworks(); initHearts(); });

    setTimeout(function() {
      var btn = document.getElementById("anni-enter-btn");
      if (btn) {
        btn.addEventListener("click", function() {
          screen.style.animation = "anniFadeOut 0.8s ease forwards";
          setTimeout(function() { screen.style.display = "none"; }, 800);
        });
      }
    }, 100);
  }

  /* ─── FIREWORKS ─────────────────────────────────────────── */
  function initFireworks() {
    var canvas = document.getElementById("anni-canvas");
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    window.addEventListener("resize", function() {
      canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    });
    var COLORS = ["#FFD700","#FF6B6B","#FF1493","#FF69B4","#FFA500","#FFFFFF","#FFE4E1","#FFB6C1"];
    var particles = [];

    function Particle(x, y, color) {
      this.x = x; this.y = y; this.color = color;
      var angle = Math.random() * Math.PI * 2, speed = 2 + Math.random() * 6;
      this.vx = Math.cos(angle) * speed; this.vy = Math.sin(angle) * speed;
      this.alpha = 1; this.decay = 0.012 + Math.random() * 0.015;
      this.size = 2 + Math.random() * 3; this.gravity = 0.08;
    }
    Particle.prototype.update = function() {
      this.x += this.vx; this.y += this.vy; this.vy += this.gravity;
      this.vx *= 0.98; this.alpha -= this.decay;
    };
    Particle.prototype.draw = function(c) {
      c.save(); c.globalAlpha = Math.max(0, this.alpha);
      c.fillStyle = this.color; c.shadowColor = this.color; c.shadowBlur = 8;
      c.beginPath(); c.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      c.fill(); c.restore();
    };
    Particle.prototype.isDead = function() { return this.alpha <= 0; };

    function burst(x, y) {
      var c = COLORS[Math.floor(Math.random() * COLORS.length)];
      for (var i = 0; i < 70; i++) particles.push(new Particle(x, y, c));
    }
    var lastBurst = 0;
    function loop(ts) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (ts - lastBurst > 700 + Math.random() * 400) {
        burst(canvas.width * (0.15 + Math.random() * 0.7), canvas.height * (0.1 + Math.random() * 0.5));
        if (Math.random() > 0.5) burst(canvas.width * (0.15 + Math.random() * 0.7), canvas.height * (0.1 + Math.random() * 0.5));
        lastBurst = ts;
      }
      for (var i = particles.length - 1; i >= 0; i--) {
        particles[i].update(); particles[i].draw(ctx);
        if (particles[i].isDead()) particles.splice(i, 1);
      }
      requestAnimationFrame(loop);
    }
    setTimeout(function(){ burst(canvas.width*0.3, canvas.height*0.3); }, 200);
    setTimeout(function(){ burst(canvas.width*0.7, canvas.height*0.25); }, 500);
    setTimeout(function(){ burst(canvas.width*0.5, canvas.height*0.4); }, 900);
    requestAnimationFrame(loop);
  }

  /* ─── UÇAN ÜRƏKLƏR ─────────────────────────────────────── */
  function initHearts() {
    var container = document.getElementById("anniversary-screen");
    if (!container) return;
    var hearts = ["❤️","🧡","💛","💕","💖","💗","💓"];
    function spawnHeart() {
      var span = document.createElement("span");
      span.className = "anni-floating-heart";
      span.textContent = hearts[Math.floor(Math.random() * hearts.length)];
      var dir = (Math.random() > 0.5 ? 1 : -1) * (20 + Math.random() * 30);
      var rot = Math.floor(Math.random() * 60 - 30);
      span.style.cssText = "left:" + (Math.random()*100) + "%;font-size:" + (14+Math.random()*20) + "px;" +
        "animation-duration:" + (4+Math.random()*5) + "s;animation-delay:" + (Math.random()*1.5) + "s;" +
        "--anni-heart-dir:" + dir + "px;--anni-heart-rot:" + rot + "deg;";
      container.appendChild(span);
      setTimeout(function(){ span.remove(); }, 11000);
    }
    for (var i = 0; i < 10; i++) (function(d){ setTimeout(spawnHeart, d*250); })(i);
    var iv = setInterval(spawnHeart, 600);
    setTimeout(function(){ clearInterval(iv); }, 30000);
  }

  /* ─── KONFETTİ ──────────────────────────────────────────── */
  function launchConfetti() {
    var colors = ["#FFD700","#FF6B6B","#FF1493","#00FF7F","#1E90FF","#FFFFFF"];
    var container = document.getElementById("anniversary-screen");
    if (!container) return;
    for (var i = 0; i < 100; i++) {
      var p = document.createElement("div");
      p.className = "anni-confetti";
      p.style.cssText = "left:" + (Math.random()*100) + "%;background:" + colors[Math.floor(Math.random()*colors.length)] + ";" +
        "width:" + (5+Math.random()*8) + "px;height:" + (8+Math.random()*10) + "px;" +
        "animation-duration:" + (2+Math.random()*3) + "s;animation-delay:" + (Math.random()*2) + "s;" +
        "transform:rotate(" + (Math.random()*360) + "deg);border-radius:" + (Math.random()>0.5?"50%":"2px") + ";";
      container.appendChild(p);
      setTimeout(function(){ p.remove(); }, 6000);
    }
  }

  /* ─── CSS İNJEKT ────────────────────────────────────────── */
  function injectStyles() {
    var style = document.createElement("style");
    style.textContent = [
      ".anni-countdown-widget{margin-bottom:24px;border-radius:24px;",
      "background:linear-gradient(135deg,rgba(139,0,0,.35) 0%,rgba(180,20,60,.28) 40%,rgba(255,165,0,.15) 100%);",
      "border:1px solid rgba(255,215,0,.3);overflow:hidden;position:relative;",
      "box-shadow:0 8px 32px rgba(139,0,0,.3),inset 0 1px 0 rgba(255,215,0,.15)}",
      ".anni-countdown-widget::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;",
      "background:linear-gradient(90deg,transparent,#FFD700,transparent)}",
      ".anni-widget-inner{padding:24px 20px 20px;text-align:center}",
      ".anni-widget-header{margin-bottom:20px}",
      ".anni-widget-badge{display:inline-flex;align-items:center;gap:6px;font-size:.68rem;font-weight:700;",
      "letter-spacing:.12em;color:#FFD700;text-transform:uppercase;background:rgba(255,215,0,.1);",
      "border:1px solid rgba(255,215,0,.25);border-radius:100px;padding:4px 12px;margin-bottom:10px}",
      ".anni-badge-sparkle{animation:anniSparkle 2s ease-in-out infinite}",
      "@keyframes anniSparkle{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(1.3)}}",
      ".anni-widget-title{font-size:1.15rem;font-weight:700;color:#fff;margin:0 0 4px}",
      ".anni-widget-sub{font-size:.8rem;color:rgba(255,215,0,.7);margin:0}",
      ".anni-display{display:flex;align-items:center;justify-content:center;gap:6px;margin-bottom:16px}",
      ".anni-time-block{display:flex;flex-direction:column;align-items:center;gap:4px;min-width:64px;",
      "background:rgba(255,215,0,.08);border:1px solid rgba(255,215,0,.2);border-radius:14px;padding:10px 8px}",
      ".anni-num{font-size:1.8rem;font-weight:800;background:linear-gradient(135deg,#FFD700,#FF6B6B);",
      "-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;",
      "line-height:1;font-variant-numeric:tabular-nums;min-width:2ch;text-align:center}",
      ".anni-time-block label{font-size:.6rem;text-transform:uppercase;letter-spacing:.08em;color:rgba(255,255,255,.5);font-weight:600}",
      ".anni-sep{font-size:1.4rem;font-weight:800;color:rgba(255,215,0,.5);margin-top:-8px}",
      ".anni-arrived-msg{font-size:1.3rem;font-weight:800;color:#FFD700;text-align:center;padding:12px;",
      "animation:anniBounce 1s ease-in-out infinite}",
      "@keyframes anniBounce{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}",
      ".anni-widget-footer{margin-top:8px}",
      ".anni-heart-dots{display:flex;justify-content:center;gap:8px;font-size:1rem;opacity:.7}",
      ".anni-hidden{display:none!important}",
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
      "@keyframes anniBtnPulse{0%,100%{box-shadow:0 4px 20px rgba(255,215,0,.4),0 8px 40px rgba(255,100,100,.2)}",
      "50%{box-shadow:0 4px 30px rgba(255,215,0,.7),0 8px 60px rgba(255,100,100,.4)}}",
      ".anni-enter-btn:hover{transform:scale(1.04)}.anni-enter-btn:active{transform:scale(.98)}",
      ".anni-floating-heart{position:absolute;bottom:-50px;pointer-events:none;z-index:5;",
      "animation:anniHeartFloat linear forwards}",
      "@keyframes anniHeartFloat{0%{bottom:-50px;opacity:0;transform:translateX(0) rotate(0)}",
      "10%{opacity:1}80%{opacity:.8}100%{bottom:110%;opacity:0;transform:translateX(var(--anni-heart-dir,30px)) rotate(var(--anni-heart-rot,15deg))}}",
      ".anni-confetti{position:absolute;top:-20px;z-index:5;pointer-events:none;animation:anniConfettiFall linear forwards}",
      "@keyframes anniConfettiFall{0%{top:-20px;opacity:1;transform:rotate(0) translateX(0)}",
      "100%{top:110vh;opacity:0;transform:rotate(720deg) translateX(60px)}}",
      "@media(max-width:480px){.anni-time-block{min-width:52px;padding:8px 6px}",
      ".anni-num{font-size:1.5rem}.anni-headline{font-size:.95rem}",
      ".anni-content-inner{padding:28px 18px 24px}",
      ".anni-year-display,.anni-year-ring{width:110px;height:110px}",
      ".anni-year-core{width:90px;height:90px}.anni-year-num{font-size:2.5rem}",
      ".anni-stats-row{gap:10px}.anni-stat strong{font-size:1.1rem}",
      ".anni-enter-btn{padding:13px 28px;font-size:.88rem}}"
    ].join("");
    document.head.appendChild(style);
  }

  /* ─── ANA BAŞLATMA ──────────────────────────────────────── */
  function init() {
    injectStyles();
    injectCountdownWidget();
    patchDailyMessage();

    // Gizli qısayol: 'Ctrl+Shift+Y' basanda test üçün açılsın
    document.addEventListener("keydown", function(e) {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "y") {
        // İl Dönümü səhifəsinə keç
        var homeBtn = document.querySelector('button[data-page="anniversary"]');
        if (homeBtn) homeBtn.click();

        // Geri sayım widget-ini 1 il tamam oldu vəziyyətinə gətir
        var disp = document.getElementById("anni-display");
        var arr = document.getElementById("anni-arrived-msg");
        if (disp) disp.style.display = "none";
        if (arr) arr.classList.remove("anni-hidden");

        // Tam ekran partlayışı göstər
        showAnniversaryScreen();
        setTimeout(launchConfetti, 1000);
      }
    });

    if (isAnniversaryDay()) {
      showAnniversaryScreen();
      setTimeout(launchConfetti, 1000);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();