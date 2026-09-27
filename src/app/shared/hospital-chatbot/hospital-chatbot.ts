import {
  isPlatformBrowser
} from '@angular/common';

import {
  HttpClient
} from '@angular/common/http';

import {
  Component,
  ElementRef,
  OnDestroy,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  signal,
  viewChild
} from '@angular/core';

import {
  FormsModule
} from '@angular/forms';

import {
  RouterLink
} from '@angular/router';

import {
  firstValueFrom,
  timeout
} from 'rxjs';

import {
  environment
} from '../../../environments/environment';


type ChatLanguage =
  | 'en'
  | 'hi';

type MessageSender =
  | 'user'
  | 'bot';


interface ChatHospitalLink {
  id: number;

  name: string;
}


interface ChatMessage {
  id: number;

  sender: MessageSender;

  text: string;

  sourceUrl?: string;

  hospitalLinks?: ChatHospitalLink[];
}


interface SavedChatHistory {
  version: number;

  language: ChatLanguage;

  messages: ChatMessage[];
}


interface BackendChatHospital {
  id: number;

  name: string;
}


interface BackendChatResponse {
  answer: string;

  language: ChatLanguage;

  intent: string;

  hospitals: BackendChatHospital[];

  emergencyDisclaimer: boolean;
}


interface VoiceAlternative {
  transcript: string;
}


interface VoiceResult {
  readonly length: number;

  [index: number]:
    VoiceAlternative;
}


interface VoiceResultList {
  readonly length: number;

  [index: number]:
    VoiceResult;
}


interface VoiceResultEvent
  extends Event {

  readonly results:
    VoiceResultList;
}


interface VoiceErrorEvent
  extends Event {

  readonly error: string;
}


interface VoiceRecognition {
  lang: string;

  continuous: boolean;

  interimResults: boolean;

  start(): void;

  stop(): void;

  onstart:
    (() => void) |
    null;

  onend:
    (() => void) |
    null;

  onresult:
    (
      (
        event: VoiceResultEvent
      ) => void
    ) |
    null;

  onerror:
    (
      (
        event: VoiceErrorEvent
      ) => void
    ) |
    null;
}


interface VoiceRecognitionConstructor {
  new (): VoiceRecognition;
}


interface VoiceWindow
  extends Window {

  SpeechRecognition?:
    VoiceRecognitionConstructor;

  webkitSpeechRecognition?:
    VoiceRecognitionConstructor;
}


const UI_TEXT = {
  en: {
    title:
      'CareFinder Assistant',

    subtitle:
      'Online hospital help',

    placeholder:
      'Ask about a hospital or city...',

    listening:
      'Listening... Please speak now',

    quickTitle:
      'Quick questions',

    clear:
      'Clear chat',

    close:
      'Close chatbot',

    microphone:
      'Voice input',

    send:
      'Send message',

    welcome:
      'Hello! I can help you search hospitals, insurance coverage, emergency services and hospital details from the CareFinder database.',

    languageChanged:
      'Language changed to English. How can I help you?',

    voiceUnsupported:
      'Voice input is not supported in this browser. Please use Google Chrome or Microsoft Edge.',

    microphoneDenied:
      'Microphone permission was denied. Please allow microphone permission from browser settings.',

    voiceError:
      'Voice input could not start. Please try again.',

    generalError:
      'The chatbot service is temporarily unavailable. Please try again shortly.',

    source:
      'Source'
  },

  hi: {
    title:
      'केयरफाइंडर सहायक',

    subtitle:
      'ऑनलाइन अस्पताल सहायता',

    placeholder:
      'अस्पताल या शहर के बारे में पूछें...',

    listening:
      'सुन रहा हूं... अब बोलिए',

    quickTitle:
      'जल्दी पूछें',

    clear:
      'चैट साफ करें',

    close:
      'चैटबॉट बंद करें',

    microphone:
      'आवाज़ से पूछें',

    send:
      'संदेश भेजें',

    welcome:
      'नमस्ते! मैं CareFinder database से अस्पताल, बीमा, इमरजेंसी सेवा और अस्पताल की जानकारी खोजने में आपकी सहायता कर सकता हूं।',

    languageChanged:
      'भाषा हिंदी कर दी गई है। मैं आपकी क्या सहायता कर सकता हूं?',

    voiceUnsupported:
      'इस browser में voice input उपलब्ध नहीं है। कृपया Google Chrome या Microsoft Edge इस्तेमाल करें।',

    microphoneDenied:
      'Microphone की अनुमति नहीं मिली। Browser settings से microphone permission allow करें।',

    voiceError:
      'Voice input शुरू नहीं हो पाया। कृपया दोबारा प्रयास करें।',

    generalError:
      'Chatbot service से अभी connection नहीं हो पा रहा है। कृपया कुछ देर बाद दोबारा प्रयास करें।',

    source:
      'स्रोत'
  }
};


@Component({
  selector:
    'app-hospital-chatbot',

  standalone:
    true,

  imports: [
    FormsModule,
    RouterLink
  ],

  templateUrl:
    './hospital-chatbot.html',

  styleUrl:
    './hospital-chatbot.css'
})
export class HospitalChatbot
  implements OnDestroy {

  private readonly http =
    inject(HttpClient);

  private readonly platformId =
    inject(PLATFORM_ID);

  private readonly chatStorageKey =
    'carefinder-chat-history-v2';


  readonly chatOpen =
    signal(false);

  readonly loading =
    signal(false);

  readonly listening =
    signal(false);

  readonly language =
    signal<ChatLanguage>('en');


  readonly labels =
    computed(() => {
      return UI_TEXT[
        this.language()
      ];
    });


  readonly quickQuestions =
    computed(() => {
      if (
        this.language() === 'hi'
      ) {
        return [
          'दिल्ली में कितने अस्पताल हैं?',
          'अपोलो अस्पताल की जानकारी बताएं',
          '24x7 अस्पताल दिखाएं'
        ];
      }

      return [
        'How many hospitals are in Delhi?',
        'Show Apollo Hospital details',
        'Show 24x7 hospitals'
      ];
    });


  readonly messages =
    signal<ChatMessage[]>([
      {
        id: 1,

        sender:
          'bot',

        text:
          UI_TEXT.en.welcome
      }
    ]);


  readonly messagesContainer =
    viewChild<
      ElementRef<HTMLDivElement>
    >(
      'messagesContainer'
    );


  question = '';

  private messageId = 1;

  private recognition?:
    VoiceRecognition;


  constructor() {
    this.restoreChatHistory();

    effect(() => {
      const currentMessages =
        this.messages();

      const currentLanguage =
        this.language();

      this.loading();

      this.saveChatHistory(
        currentMessages,
        currentLanguage
      );

      setTimeout(() => {
        this.scrollToBottom();
      });
    });
  }


  ngOnDestroy(): void {
    this.recognition?.stop();
  }


  toggleChat(): void {
    this.chatOpen.update(
      value => !value
    );

    if (
      this.chatOpen()
    ) {
      setTimeout(() => {
        this.scrollToBottom();
      });
    }
  }


  closeChat(): void {
    this.chatOpen.set(false);
  }


  setLanguage(
    language: ChatLanguage
  ): void {

    if (
      this.language() === language
    ) {
      return;
    }

    this.recognition?.stop();

    this.listening.set(false);

    this.language.set(
      language
    );

    this.question = '';

    this.addMessage(
      'bot',
      this.labels()
        .languageChanged
    );
  }


  async sendMessage():
    Promise<void> {

    const enteredQuestion =
      this.question.trim();

    if (
      !enteredQuestion ||
      this.loading()
    ) {
      return;
    }

    this.addMessage(
      'user',
      enteredQuestion
    );

    this.question = '';

    this.loading.set(true);

    try {
      const response =
        await firstValueFrom(
          this.http
            .post<BackendChatResponse>(
              `${environment.apiUrl}/chatbot/messages`,
              {
                message:
                  enteredQuestion,

                language:
                  this.language()
              }
            )
            .pipe(
              timeout(20_000)
            )
        );

      const hospitalLinks:
        ChatHospitalLink[] =

        (
          response.hospitals ??
          []
        )
          .slice(
            0,
            5
          )
          .map(
            hospital => {
              return {
                id:
                  hospital.id,

                name:
                  hospital.name
              };
            }
          );

      const answer =
        response.answer
          ?.trim();

      this.addMessage(
        'bot',

        answer ||
          this.labels()
            .generalError,

        undefined,

        hospitalLinks.length > 0
          ? hospitalLinks
          : undefined
      );

    } catch (error) {
      console.error(
        'Chatbot backend request failed:',
        error
      );

      this.addMessage(
        'bot',
        this.labels()
          .generalError
      );

    } finally {
      this.loading.set(false);
    }
  }


  askQuickQuestion(
    question: string
  ): void {

    this.question =
      question;

    void this.sendMessage();
  }


  clearChat(): void {
    const welcomeMessage:
      ChatMessage = {

      id:
        ++this.messageId,

      sender:
        'bot',

      text:
        this.labels()
          .welcome
    };

    this.messages.set([
      welcomeMessage
    ]);

    if (
      isPlatformBrowser(
        this.platformId
      )
    ) {
      localStorage.removeItem(
        this.chatStorageKey
      );
    }
  }


  toggleVoiceInput(): void {
    if (
      !isPlatformBrowser(
        this.platformId
      )
    ) {
      return;
    }

    if (
      this.listening()
    ) {
      this.recognition?.stop();

      return;
    }

    const browserWindow =
      window as VoiceWindow;

    const RecognitionConstructor =
      browserWindow
        .SpeechRecognition ??
      browserWindow
        .webkitSpeechRecognition;

    if (
      !RecognitionConstructor
    ) {
      this.addMessage(
        'bot',
        this.labels()
          .voiceUnsupported
      );

      return;
    }

    if (
      !this.recognition
    ) {
      this.recognition =
        new RecognitionConstructor();
    }

    const recognition =
      this.recognition;

    recognition.lang =
      this.language() === 'hi'
        ? 'hi-IN'
        : 'en-IN';

    recognition.continuous =
      false;

    recognition.interimResults =
      false;

    recognition.onstart = () => {
      this.listening.set(true);
    };

    recognition.onend = () => {
      this.listening.set(false);
    };

    recognition.onresult = (
      event: VoiceResultEvent
    ) => {
      const lastResult =
        event.results[
          event.results.length - 1
        ];

      const spokenText =
        lastResult?.[0]
          ?.transcript ??
        '';

      this.question =
        spokenText.trim();

      this.listening.set(false);
    };

    recognition.onerror = (
      event: VoiceErrorEvent
    ) => {
      this.listening.set(false);

      if (
        event.error ===
          'not-allowed' ||
        event.error ===
          'service-not-allowed'
      ) {
        this.addMessage(
          'bot',
          this.labels()
            .microphoneDenied
        );

        return;
      }

      this.addMessage(
        'bot',
        this.labels()
          .voiceError
      );
    };

    try {
      recognition.start();

    } catch (error) {
      console.error(
        'Voice input failed:',
        error
      );

      this.listening.set(false);

      this.addMessage(
        'bot',
        this.labels()
          .voiceError
      );
    }
  }


  private addMessage(
    sender: MessageSender,

    text: string,

    sourceUrl?: string,

    hospitalLinks?:
      ChatHospitalLink[]
  ): void {

    this.messages.update(
      currentMessages => {
        return [
          ...currentMessages,

          {
            id:
              ++this.messageId,

            sender,

            text,

            sourceUrl,

            hospitalLinks
          }
        ];
      }
    );
  }


  private scrollToBottom(): void {
    const element =
      this.messagesContainer()
        ?.nativeElement;

    if (
      element
    ) {
      element.scrollTop =
        element.scrollHeight;
    }
  }


  private saveChatHistory(
    messages: ChatMessage[],

    language: ChatLanguage
  ): void {

    if (
      !isPlatformBrowser(
        this.platformId
      )
    ) {
      return;
    }

    const history:
      SavedChatHistory = {

      version:
        2,

      language,

      messages
    };

    try {
      localStorage.setItem(
        this.chatStorageKey,
        JSON.stringify(
          history
        )
      );

    } catch (error) {
      console.error(
        'Chat history save nahi ho payi:',
        error
      );
    }
  }


  private restoreChatHistory():
    void {

    if (
      !isPlatformBrowser(
        this.platformId
      )
    ) {
      return;
    }

    try {
      const savedText =
        localStorage.getItem(
          this.chatStorageKey
        );

      if (
        !savedText
      ) {
        return;
      }

      const savedHistory =
        JSON.parse(
          savedText
        ) as Partial<
          SavedChatHistory
        >;

      if (
        !Array.isArray(
          savedHistory.messages
        )
      ) {
        return;
      }

      const validMessages =
        savedHistory.messages
          .filter(
            (
              message
            ): message is ChatMessage => {

              return (
                typeof message.id ===
                  'number' &&

                typeof message.text ===
                  'string' &&

                (
                  message.sender ===
                    'user' ||

                  message.sender ===
                    'bot'
                )
              );
            }
          );

      if (
        validMessages.length === 0
      ) {
        return;
      }

      if (
        savedHistory.language ===
          'en' ||

        savedHistory.language ===
          'hi'
      ) {
        this.language.set(
          savedHistory.language
        );
      }

      this.messages.set(
        validMessages
      );

      this.messageId =
        Math.max(
          1,

          ...validMessages.map(
            message => {
              return message.id;
            }
          )
        );

    } catch (error) {
      console.error(
        'Chat history restore nahi ho payi:',
        error
      );

      localStorage.removeItem(
        this.chatStorageKey
      );
    }
  }
}