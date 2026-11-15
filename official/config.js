/**
 * IMAP Studio 공식 홈페이지 설정 파일 (Configuration)
 * 텍스트, 이미지 경로, 유튜브 영상 목록, 공지사항, 링크 등을 이곳에서 쉽게 수정할 수 있습니다.
 */
const STUDIO_CONFIG = {
  // 스튜디오 기본 정보
  studio: {
    name: "IMAP Studio",
    tagline: "Private Music Atelier",
    slogan: "음악을 배우고, 만들고, 기록하는 공간",
    description: "IMAP Studio는 어쿠스틱 악기 레슨부터 전문 음원 제작, 연주 의뢰, 문화 공연 및 행사 기획까지 음악의 모든 순간을 함께하는 아늑한 음악 아틀리에입니다.",
    location: "서울시 마포구 (상세 주소 예약 후 안내)",
    hours: "매일 10:00 - 22:00 (사전 예약제)",
    contact: "contact@imapstudio.kr",
    reservationUrl: "https://res-eight-drab.vercel.app/",
    adminUrl: "http://lesson-schedule-beta.vercel.app"
  },

  // 대표 이미지 경로 관리 (나중에 이미지 교체 시 이곳의 경로만 변경하면 됩니다)
  images: {
    hero: "../imap_studio_hero.jpg", // 스튜디오 대표 히어로 이미지
    atelier: "../imap_studio_hero.jpg",
    logoText: "IMAP STUDIO"
  },

  // 레슨 안내 데이터 (악기별)
  lessons: [
    {
      id: "classic-guitar",
      title: "클래식 기타",
      subtitle: "Classic Guitar",
      desc: "정통 클래식 주법부터 나일론 스트링의 깊고 따뜻한 울림, 핑거스타일 소품곡까지 섬세한 터치를 배웁니다.",
      tags: ["자세 교정", "독보법", "터치 & 톤", "소품곡 마스터"],
      icon: "guitar-classic"
    },
    {
      id: "acoustic-guitar",
      title: "통기타 (어쿠스틱)",
      subtitle: "Acoustic Guitar",
      desc: "기초 오픈 코드와 스트로크 리듬부터 감성적인 핑거스타일, 핑거피킹 아르페지오까지 맞춤형 커리큘럼을 제공합니다.",
      tags: ["코드 반주", "핑거스타일", "타브 악보", "보컬 반주"],
      icon: "guitar-acoustic"
    },
    {
      id: "electric-guitar",
      title: "일렉트릭 기타",
      subtitle: "Electric Guitar",
      desc: "블루스, 록, 팝, 재즈 등 다양한 장르의 릭과 톤 메이킹, 펜타토닉 솔로잉 및 앙상블 즉흥 연주를 지도합니다.",
      tags: ["이펙터 톤 메이킹", "스케일 & 솔로", "장르별 릭", "즉흥 연주"],
      icon: "guitar-electric"
    },
    {
      id: "bass-guitar",
      title: "베이스 기타",
      subtitle: "Bass Guitar",
      desc: "밴드 사운드의 심장인 그루브를 만듭니다. 안정적인 타임감, 핑거링/슬랩 테크닉, 코드 진행에 따른 베이스 라인 구축.",
      tags: ["루트 & 그루브", "슬랩(Slap)", "리듬 트레이닝", "합주 팁"],
      icon: "guitar-bass"
    },
    {
      id: "drums",
      title: "드럼",
      subtitle: "Drums & Percussion",
      desc: "기초 스틱 그립과 패드 연습, 8비트/16비트 리듬 콤비네이션부터 다양한 필인과 다이내믹 컨트롤까지 단계별 트레이닝.",
      tags: ["스틱 테크닉", "리듬 박자감", "필인 메이킹", "곡 카피"],
      icon: "drum"
    },
    {
      id: "midi-composition",
      title: "미디 & 작곡",
      subtitle: "MIDI & Music Production",
      desc: "DAW를 활용한 나만의 음악 제작. 가상악기 운용, 비트메이킹, 화성학 기초, 사운드 밸런스 기초를 실습 중심으로 배웁니다.",
      tags: ["DAW 실습", "비트메이킹", "실용 화성학", "데모 완성"],
      icon: "midi"
    }
  ],

  // 작업 및 연주·행사 의뢰 데이터
  services: [
    {
      category: "음악 제작 & 프로덕션",
      items: [
        {
          title: "편곡 & 악보 제작",
          desc: "보컬곡, 앙상블, 독주곡에 맞춘 맞춤형 편곡과 전문 사보 소프트웨어를 통한 깔끔한 정식 악보(PDF/인쇄본) 제작.",
          badge: "Arrangement"
        },
        {
          title: "레코딩 (Recording)",
          desc: "어쿠스틱 악기, 보컬, 기타 솔로 등 고음질 프리앰프와 마이크 시스템을 통한 프라이빗 스튜디오 트래킹.",
          badge: "Tracking"
        },
        {
          title: "믹싱 & 마스터링",
          desc: "악기 간 조화로운 밸런싱과 입체적인 음장감 구현, 스트리밍 플랫폼 규격에 최적화된 마스터링 사운드 완성.",
          badge: "Mixing & Mastering"
        }
      ]
    },
    {
      category: "미디어 제작",
      items: [
        {
          title: "연주 영상 촬영 & 편집",
          desc: "고화질 시네마틱 카메라를 활용한 악기 연주 영상, 아티스트 프로필 클립, 쇼츠/릴스 포맷 촬영 및 색보정·오디오 싱크 편집.",
          badge: "Video Production"
        }
      ]
    },
    {
      category: "연주 의뢰 & 공연·행사 기획",
      items: [
        {
          title: "연주 의뢰 (Live & Session)",
          desc: "결혼식, 리셉션, 기업 행사, 갤러리 전시 오프닝 등의 고품격 라이브 연주(클래식 기타 듀오, 어쿠스틱 앙상블, 재즈 밴드 세션).",
          badge: "Performance"
        },
        {
          title: "공연 및 행사 기획·진행",
          desc: "음향/조명 셋업, 무대 큐시트 연출, 아티스트 섭외부터 현장 진행 총괄까지 맞춤형 음악 행사 원스톱 프로덕션.",
          badge: "Event Direction"
        }
      ]
    }
  ],

  // 유튜브 영상 카드 갤러리 (YouTube Video ID 또는 전체 URL 입력 가능)
  // 나중에 관리자 화면이나 데이터 교체 시 이 배열만 수정하면 됩니다.
  videos: [
    {
      id: "v1",
      title: "Acoustic Guitar Session - Autumn Leaves (Live at IMAP)",
      desc: "IMAP Studio 어쿠스틱 세션 라이브 레코딩 영상",
      youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", // 예시 유튜브 주소
      youtubeId: "dQw4w9WgXcQ"
    },
    {
      id: "v2",
      title: "Classic & Nylon Guitar Tone Masterclass",
      desc: "클래식 기타 톤 메이킹과 마이킹 테크닉 팁",
      youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      youtubeId: "dQw4w9WgXcQ"
    },
    {
      id: "v3",
      title: "Studio Ensemble & Arrangement Project",
      desc: "기타 앙상블과 베이스, 드럼 합주 편곡 프로젝트 클립",
      youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      youtubeId: "dQw4w9WgXcQ"
    }
  ],

  // 공지사항 데이터
  notices: [
    {
      id: "n1",
      date: "2026.11.01",
      category: "안내",
      title: "IMAP Studio 공식 홈페이지 및 온라인 상담 예약 시스템 오픈",
      content: "IMAP Studio의 공식 웹사이트가 새롭게 단장되었습니다. 이제 레슨 상담 및 작업·연주 의뢰를 온라인 예약 페이지를 통해 실시간으로 간편하게 신청하실 수 있습니다."
    },
    {
      id: "n2",
      date: "2026.10.25",
      category: "레슨",
      title: "클래식·어쿠스틱·일렉 기타 1:1 맞춤 커리큘럼 신규 수강 안내",
      content: "입문자부터 심화 테크닉을 원하는 분까지, 전문 강사진과의 1:1 프라이빗 레슨 정규 세션이 개설되었습니다. 상세 내용은 상담 예약 시 친절히 안내해 드립니다."
    },
    {
      id: "n3",
      date: "2026.10.15",
      category: "프로덕션",
      title: "음반 레코딩 & 영상 촬영 올인원 패키지 안내",
      content: "연주곡 녹음과 고화질 4K 시네마틱 영상 촬영 및 음원 믹싱을 한 번에 진행할 수 있는 스튜디오 올인원 패키지를 운영합니다. 작업 의뢰 섹션을 확인해 주세요."
    }
  ]
};
