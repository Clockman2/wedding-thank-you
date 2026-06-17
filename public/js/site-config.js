window.THANK_YOU_SITE = {
  coupleNames: "John & Amanda",
  weddingDate: "2026-01-01",
  loadingMessages: [
    "Loading happy tears...",
    "Importing wedding cake...",
    "Checking visa status...",
    "Finding the good confetti...",
    "Warming up the dance floor...",
    "Polishing tiny picture frames...",
    "Asking the DJ for one more song..."
  ],
  fallbackSplash: {
    en: {
      kicker: "A little memory",
      title: "Glad you are here, {guestName}",
      caption: "We picked a favorite photo from the shared gallery just to make this note feel a little more alive.",
      alt: "A shared wedding gallery photo"
    },
    pt: {
      kicker: "Uma pequena memória",
      title: "Que bom ter você aqui, {guestName}",
      caption: "Escolhemos uma foto da galeria compartilhada para deixar esta mensagem mais especial.",
      alt: "Uma foto da galeria compartilhada do casamento"
    }
  },
  sweetNotes: {
    en: [
      "Your love and encouragement made this season feel lighter.",
      "We are still smiling because people like you showed up for us.",
      "Thank you for being part of the story we will keep telling.",
      "Some gifts are wrapped, and some gifts are simply people who care. You are one of those gifts."
    ],
    pt: [
      "Seu carinho e incentivo deixaram esta fase mais leve.",
      "Ainda estamos sorrindo porque pessoas como você estiveram conosco.",
      "Obrigado por fazer parte da história que vamos continuar contando.",
      "Alguns presentes vêm embrulhados, e outros são pessoas que amam. Você é um desses presentes."
    ]
  },
  rickRollUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  vibeMedia: {
    brazil: {
      audio: "/music/brazil/brazil.mp3",
      backgrounds: [
        "/assets/vibes/brazil/brazil-1.jpg",
        "/assets/vibes/brazil/brazil-2.jpg"
      ]
    },
    "new-mexico": {
      audio: "/music/new-mexico/new-mexico.mp3",
      backgrounds: [
        "/assets/vibes/new-mexico/new-mexico-1.jpg",
        "/assets/vibes/new-mexico/new-mexico-2.jpg"
      ]
    }
  },
  gallery: [
    {
      src: "/assets/gallery/rings-bible.jpg",
      rotation: "-2.4deg",
      caption: {
        en: "The little details",
        pt: "Os pequenos detalhes"
      }
    },
    {
      src: "/assets/gallery/story-figurines.jpg",
      rotation: "2.1deg",
      caption: {
        en: "A tiny version of us",
        pt: "Uma versão pequena de nós"
      }
    }
  ],
  vibePhrases: {
    classic: {
      en: "So glad you were here.",
      pt: "Que bom que você esteve aqui."
    },
    brazil: {
      en: "Obrigado, que alegria, vamos celebrar.",
      pt: "Obrigado, que alegria, vamos celebrar."
    },
    "new-mexico": {
      en: "Desert skies, mountain views, and just enough green chile.",
      pt: "Céu do deserto, montanhas e um pouco de chile verde."
    }
  },
  defaultMessages: {
    en: {
      greeting: "Dear {guestName},",
      message:
        "Thank you for being part of this day. Your kindness, encouragement, and presence mean so much.",
      signature: "With gratitude, John & Amanda"
    },
    pt: {
      greeting: "Olá, {guestName},",
      message:
        "Obrigado por fazer parte deste dia. Sua presença, seu carinho e seu incentivo significam muito.",
      signature: "Com gratidão, John & Amanda"
    }
  },
  content: {
    en: {
      pageTitle: "Thank You",
      description: "A personalized thank-you note demo.",
      heroEyebrow: "Thank you for being here",
      scrollCue: "Read more",
      scrollCueLabel: "Read the next section",
      storyKicker: "A note",
      storyTitle: "A simple thank-you",
      storyParagraphs: [
        "This demo keeps the public version generic while showing how personalized routes can work.",
        "Use the guest configuration and CSV file to add private names, photos, and messages in your own copy.",
        "The same page can serve English and Brazilian Portuguese routes without needing separate templates."
      ],
      celebrationKicker: "Still celebrating",
      celebrationTitle: "The party keeps going.",
      celebrationCopy:
        "Open the note, press the questionable button, or switch the page into a different kind of celebration.",
      marriedCounterPrefix: "We've been married for",
      marriedCounterOne: "day.",
      marriedCounterMany: "days.",
      envelopeTitle: "Open a little note",
      envelopeCopyClosed: "A tiny thank-you is tucked inside.",
      envelopeCopyOpen: "Still grateful. Still celebrating. Still amazed you were part of this.",
      confettiButton: "Confetti",
      doNotPress: "Do not press",
      doNotPressAfter: "Opening something extremely serious...",
      panicNote: "You pressed it. The internet is handling the consequences.",
      galleryKicker: "Shared gallery",
      galleryTitle: "Little frames from the day.",
      guestbookKicker: "Guestbook",
      guestbookTitle: "Leave a message, memory, or prayer.",
      guestbookNameLabel: "Your name",
      guestbookMessageLabel: "Your note",
      guestbookSubmit: "Add to the wall",
      guestbookLoading: "Gathering notes...",
      guestbookEmpty: "No notes yet. You could be first.",
      guestbookSuccess: "Saved for review. Thank you.",
      guestbookError: "The note could not be saved yet.",
      photoUploadKicker: "Photo drop",
      photoUploadTitle: "Share a wedding picture.",
      photoUploadCopy: "Send a favorite photo and it can join the shared gallery.",
      photoUploadNameLabel: "Your name",
      photoUploadFileLabel: "Choose a photo",
      photoUploadSubmit: "Upload photo",
      photoUploadReady: "Photo ready to upload.",
      photoUploadSuccess: "Photo received for review. Thank you for sharing it.",
      photoUploadError: "The photo could not be uploaded yet.",
      closingSignature: "With love, John & Amanda",
      gratitudeKicker: "With gratitude",
      gratitudeTitle: "Thank you for being part of the story.",
      gratitudeCopy:
        "For showing up, cheering us on, sending love from afar, and making this season feel full of support."
    },
    pt: {
      pageTitle: "Obrigado",
      description: "Uma demonstração de mensagem personalizada de agradecimento.",
      heroEyebrow: "Obrigado por estar aqui",
      scrollCue: "Ler mais",
      scrollCueLabel: "Leia a próxima seção",
      storyKicker: "Uma mensagem",
      storyTitle: "Um agradecimento simples",
      storyParagraphs: [
        "Esta demonstração mantém a versão pública genérica enquanto mostra como rotas personalizadas podem funcionar.",
        "Use a configuração de convidados e o arquivo CSV para adicionar nomes, fotos e mensagens privadas na sua própria cópia.",
        "A mesma página pode servir rotas em inglês e português brasileiro sem precisar de modelos separados."
      ],
      celebrationKicker: "Ainda celebrando",
      celebrationTitle: "A festa continua.",
      celebrationCopy:
        "Abra o bilhete, aperte o botão duvidoso ou mude a página para outro tipo de celebração.",
      marriedCounterPrefix: "Estamos casados há",
      marriedCounterOne: "dia.",
      marriedCounterMany: "dias.",
      envelopeTitle: "Abra um bilhetinho",
      envelopeCopyClosed: "Um pequeno agradecimento está aqui dentro.",
      envelopeCopyOpen: "Ainda gratos. Ainda celebrando. Ainda felizes por você fazer parte disso.",
      confettiButton: "Confete",
      doNotPress: "Não aperte",
      doNotPressAfter: "Abrindo algo extremamente sério...",
      panicNote: "Você apertou. A internet vai cuidar das consequências.",
      galleryKicker: "Galeria compartilhada",
      galleryTitle: "Pequenos registros do dia.",
      guestbookKicker: "Livro de visitas",
      guestbookTitle: "Deixe uma mensagem, memória ou oração.",
      guestbookNameLabel: "Seu nome",
      guestbookMessageLabel: "Sua mensagem",
      guestbookSubmit: "Adicionar ao mural",
      guestbookLoading: "Buscando mensagens...",
      guestbookEmpty: "Ainda não há mensagens. Você pode ser o primeiro.",
      guestbookSuccess: "Mensagem salva para revisão. Obrigado.",
      guestbookError: "Ainda não foi possível salvar a mensagem.",
      photoUploadKicker: "Envio de fotos",
      photoUploadTitle: "Compartilhe uma foto do casamento.",
      photoUploadCopy: "Envie uma foto favorita para ela entrar na galeria compartilhada.",
      photoUploadNameLabel: "Seu nome",
      photoUploadFileLabel: "Escolha uma foto",
      photoUploadSubmit: "Enviar foto",
      photoUploadReady: "Foto pronta para enviar.",
      photoUploadSuccess: "Foto recebida para revisão. Obrigado por compartilhar.",
      photoUploadError: "Ainda não foi possível enviar a foto.",
      closingSignature: "Com amor, John & Amanda",
      gratitudeKicker: "Com gratidão",
      gratitudeTitle: "Obrigado por fazer parte da história.",
      gratitudeCopy:
        "Por estarem presentes, torcerem, enviarem carinho de longe e fazerem esta fase parecer cheia de apoio."
    }
  },
  guests: {
    "test-en": {
      en: {
        greeting: "Dear Test EN,"
      },
      splash: {
        image: "/assets/guests/test-en.jpg",
        rotation: "1.35deg",
        en: {
          kicker: "Test photo",
          title: "Glad you are here, Test EN",
          caption: "A simple demo splash photo before the thank-you note.",
          alt: "Demo guest photo for the English test route"
        }
      }
    },
    "test-pt": {
      pt: {
        greeting: "Olá, Teste PT,"
      },
      splash: {
        image: "/assets/guests/test-pt.jpg",
        rotation: "-1.8deg",
        pt: {
          kicker: "Foto de teste",
          title: "Que bom ter você aqui, Teste PT",
          caption: "Uma tela inicial de demonstração antes da mensagem de agradecimento.",
          alt: "Foto de demonstração para a rota em português"
        }
      }
    }
  }
};
