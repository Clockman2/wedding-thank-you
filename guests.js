window.THANK_YOU_SITE = {
  coupleNames: "the hosts",
  defaultMessages: {
    en: {
      greeting: "Dear {guestName},",
      message:
        "Thank you for being part of this day. Your kindness, encouragement, and presence mean so much.",
      signature: "With gratitude, the hosts"
    },
    pt: {
      greeting: "Olá, {guestName},",
      message:
        "Obrigado por fazer parte deste dia. Sua presença, seu carinho e seu incentivo significam muito.",
      signature: "Com gratidão, os anfitriões"
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
