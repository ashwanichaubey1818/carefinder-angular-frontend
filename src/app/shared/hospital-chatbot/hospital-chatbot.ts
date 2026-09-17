import {
  isPlatformBrowser
} from '@angular/common';

import {
  HttpClient,
  HttpParams
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
  Hospital
} from '../../data/hospitals';

import {
  HospitalApiService
} from '../../services/hospital-api.service';


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


interface WikipediaPage {
  title: string;

  extract?: string;

  fullurl?: string;
}


interface WikipediaResponse {
  query?: {
    pages?: Record<
      string,
      WikipediaPage
    >;
  };
}


interface InternetResult {
  title: string;

  summary: string;

  url: string;
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
      'Hello! I can help you find hospitals, insurance information, emergency services and public hospital details from the internet.',

    languageChanged:
      'Language changed to English. How can I help you?',

    voiceUnsupported:
      'Voice input is not supported in this browser. Please use Google Chrome or Microsoft Edge.',

    microphoneDenied:
      'Microphone permission was denied. Please allow microphone permission from browser settings.',

    voiceError:
      'Voice input could not start. Please try again.',

    generalError:
      'Sorry, information could not be loaded. Please check your internet connection and try again.',

    directoryError:
      'The hospital directory could not be loaded. Please confirm that the backend is running and try again.',

    noInformation:
      'I could not find reliable information for this question. Try entering the hospital name with its city.',

    noHospitals:
      'No matching hospital was found in the CareFinder directory.',

    source:
      'Internet source'
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
      'नमस्ते! मैं अस्पताल खोजने, बीमा जानकारी, आपातकालीन सेवा और इंटरनेट से सार्वजनिक अस्पताल जानकारी प्राप्त करने में आपकी सहायता कर सकता हूं।',

    languageChanged:
      'भाषा हिंदी कर दी गई है। मैं आपकी क्या सहायता कर सकता हूं?',

    voiceUnsupported:
      'इस ब्राउज़र में वॉइस इनपुट उपलब्ध नहीं है। कृपया Google Chrome या Microsoft Edge इस्तेमाल करें।',

    microphoneDenied:
      'माइक्रोफोन की अनुमति नहीं मिली। Browser settings से microphone permission allow करें।',

    voiceError:
      'वॉइस इनपुट शुरू नहीं हो पाया। कृपया दोबारा प्रयास करें।',

    generalError:
      'जानकारी लोड नहीं हो पाई। अपना इंटरनेट कनेक्शन जांचकर दोबारा प्रयास करें।',

    directoryError:
      'Hospital directory लोड नहीं हो पाई। Backend चालू है या नहीं, जांचकर दोबारा प्रयास करें।',

    noInformation:
      'इस सवाल के लिए जानकारी नहीं मिली। अस्पताल के नाम के साथ शहर का नाम भी लिखें।',

    noHospitals:
      'CareFinder directory में कोई matching hospital नहीं मिला।',

    source:
      'इंटरनेट स्रोत'
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

  private readonly hospitalApi =
    inject(HospitalApiService);

  private readonly platformId =
    inject(PLATFORM_ID);


  private readonly chatStorageKey =
    'carefinder-chat-history-v1';


  private readonly hospitals =
    signal<Hospital[]>([]);


  private hospitalLoadPromise?:
    Promise<Hospital[]>;


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
          'दिल्ली के अस्पताल बताएं',

          'अपोलो अस्पताल की जानकारी',

          '24x7 अस्पताल बताएं'
        ];
      }

      return [
        'Hospitals in Delhi',

        'Apollo Hospital details',

        'Show 24x7 hospitals'
      ];
    });


  readonly messages =
    signal<ChatMessage[]>([
      {
        id: 1,

        sender: 'bot',

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


    if (
      isPlatformBrowser(
        this.platformId
      )
    ) {
      void this
        .ensureHospitalsLoaded()
        .catch(() => {
          // Next question will retry.
        });
    }
  }


  ngOnDestroy(): void {
    this.recognition?.stop();
  }


  toggleChat(): void {
    this.chatOpen.update(
      value => !value
    );
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


    const preparedQuestion =
      this.prepareQuestion(
        enteredQuestion
      );


    if (
      this.isGreeting(
        preparedQuestion
      )
    ) {
      this.addMessage(
        'bot',

        this.labels()
          .welcome
      );

      return;
    }


    this.loading.set(true);


    try {
      let backendHospitals:
        Hospital[] = [];

      let directoryAvailable =
        true;


      try {
        backendHospitals =
          await this
            .ensureHospitalsLoaded();

      } catch {
        directoryAvailable =
          false;
      }


      const areaSearch =
        this.isAreaSearch(
          preparedQuestion
        );

      const open24x7Search =
        this.is24x7Search(
          preparedQuestion
        );

      const emergencySearch =
        this.isEmergencySearch(
          preparedQuestion
        );

      const insuranceProvider =
        this.findMentionedInsurance(
          preparedQuestion,

          backendHospitals
        );


      const hospital =
        this.findBestHospital(
          preparedQuestion,

          backendHospitals
        );


      /*
       * Exact hospital result
       */
      if (
        hospital &&
        !areaSearch
      ) {
        const internetInformation =
          await this
            .loadInternetInformation(
              `${hospital.name} ${hospital.city}`
            );


        let answer =
          this.createHospitalAnswer(
            hospital
          );


        if (
          internetInformation
        ) {
          answer +=
            `\n\n🌐 ${internetInformation.title}\n` +

            internetInformation.summary;
        }


        this.addMessage(
          'bot',

          answer,

          internetInformation?.url,

          [
            {
              id:
                hospital.id,

              name:
                hospital.name
            }
          ]
        );

        return;
      }


      const hospitalListSearch =
        areaSearch ||

        open24x7Search ||

        emergencySearch ||

        Boolean(
          insuranceProvider
        );


      /*
       * City, emergency, 24x7 and
       * insurance hospital list.
       */
      if (
        hospitalListSearch
      ) {
        if (
          !directoryAvailable
        ) {
          this.addMessage(
            'bot',

            this.labels()
              .directoryError
          );

          return;
        }


        let matchingHospitals = [
          ...backendHospitals
        ];


        if (
          areaSearch
        ) {
          matchingHospitals =
            this.findHospitalsByArea(
              preparedQuestion,

              matchingHospitals
            );
        }


        if (
          open24x7Search
        ) {
          matchingHospitals =
            matchingHospitals.filter(
              currentHospital => {
                return (
                  currentHospital.open24x7
                );
              }
            );
        }


        if (
          emergencySearch
        ) {
          matchingHospitals =
            matchingHospitals.filter(
              currentHospital => {
                return (
                  currentHospital.emergency
                );
              }
            );
        }


        if (
          insuranceProvider
        ) {
          const normalizedProvider =
            this.normalizeText(
              insuranceProvider
            );


          matchingHospitals =
            matchingHospitals.filter(
              currentHospital => {
                return currentHospital
                  .insurance
                  .some(provider => {
                    return (
                      this.normalizeText(
                        provider
                      ) ===
                      normalizedProvider
                    );
                  });
              }
            );
        }


        if (
          matchingHospitals.length ===
          0
        ) {
          this.addMessage(
            'bot',

            this.labels()
              .noHospitals
          );

          return;
        }


        this.addMessage(
          'bot',

          this.createHospitalListAnswer(
            matchingHospitals
          ),

          undefined,

          this.createHospitalLinks(
            matchingHospitals
          )
        );

        return;
      }


      /*
       * Wikipedia fallback
       */
      const internetInformation =
        await this
          .loadInternetInformation(
            preparedQuestion
          );


      if (
        internetInformation
      ) {
        this.addMessage(
          'bot',

          `🌐 ${internetInformation.title}\n\n` +

            internetInformation.summary,

          internetInformation.url
        );

      } else {
        this.addMessage(
          'bot',

          directoryAvailable
            ? this.labels()
                .noInformation

            : this.labels()
                .directoryError
        );
      }

    } catch {
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
          ?.transcript ?? '';


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

      } else {
        this.addMessage(
          'bot',

          this.labels()
            .voiceError
        );
      }
    };


    try {
      recognition.start();

    } catch {
      this.listening.set(false);

      this.addMessage(
        'bot',

        this.labels()
          .voiceError
      );
    }
  }


  private async ensureHospitalsLoaded():
    Promise<Hospital[]> {

    const cachedHospitals =
      this.hospitals();


    if (
      cachedHospitals.length > 0
    ) {
      return cachedHospitals;
    }


    if (
      this.hospitalLoadPromise
    ) {
      return this
        .hospitalLoadPromise;
    }


    this.hospitalLoadPromise =
      this.loadAllHospitals();


    try {
      return await this
        .hospitalLoadPromise;

    } finally {
      this.hospitalLoadPromise =
        undefined;
    }
  }


  private async loadAllHospitals():
    Promise<Hospital[]> {

    const firstPage =
      await firstValueFrom(
        this.hospitalApi
          .search({
            sort:
              'recommended',

            page:
              0,

            size:
              50
          })
          .pipe(
            timeout(10000)
          )
      );


    const remainingPageNumbers =
      Array.from(
        {
          length:
            Math.max(
              firstPage.totalPages - 1,

              0
            )
        },

        (
          _,
          index
        ) => {
          return index + 1;
        }
      );


    const remainingPages =
      await Promise.all(
        remainingPageNumbers.map(
          pageNumber => {
            return firstValueFrom(
              this.hospitalApi
                .search({
                  sort:
                    'recommended',

                  page:
                    pageNumber,

                  size:
                    50
                })
                .pipe(
                  timeout(10000)
                )
            );
          }
        )
      );


    const allHospitals = [
      ...firstPage.content,

      ...remainingPages.flatMap(
        page => page.content
      )
    ];


    const hospitalMap =
      new Map<
        number,
        Hospital
      >();


    for (
      const hospital of allHospitals
    ) {
      hospitalMap.set(
        hospital.id,

        hospital
      );
    }


    const uniqueHospitals =
      Array.from(
        hospitalMap.values()
      );


    if (
      uniqueHospitals.length === 0
    ) {
      throw new Error(
        'Hospital directory is empty.'
      );
    }


    this.hospitals.set(
      uniqueHospitals
    );


    return uniqueHospitals;
  }


  private addMessage(
    sender: MessageSender,

    text: string,

    sourceUrl?: string,

    hospitalLinks?: ChatHospitalLink[]
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


  private createHospitalLinks(
    hospitals: Hospital[]
  ): ChatHospitalLink[] {

    return hospitals
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


  private createHospitalAnswer(
    hospital: Hospital
  ): string {

    if (
      this.language() === 'hi'
    ) {
      return (
        `🏥 ${hospital.name}\n\n` +

        `📍 स्थान: ${hospital.city}, ${hospital.state}\n` +

        `⭐ रेटिंग: ${hospital.rating} (${hospital.reviews} reviews)\n` +

        `🚨 इमरजेंसी: ${
          hospital.emergency
            ? 'उपलब्ध'
            : 'उपलब्ध नहीं'
        }\n` +

        `🕐 24x7: ${
          hospital.open24x7
            ? 'हां'
            : 'नहीं'
        }\n` +

        `🛏️ बेड: ${hospital.beds}\n` +

        `🏅 मान्यता: ${hospital.accreditation}\n` +

        `🩺 विशेषज्ञता: ${
          hospital.specialties.join(
            ', '
          )
        }\n` +

        `💳 बीमा: ${
          hospital.insurance.join(
            ', '
          )
        }\n\n` +

        'कृपया cashless treatment और insurance coverage की पुष्टि अस्पताल या insurance provider से करें।'
      );
    }


    return (
      `🏥 ${hospital.name}\n\n` +

      `📍 Location: ${hospital.city}, ${hospital.state}\n` +

      `⭐ Rating: ${hospital.rating} (${hospital.reviews} reviews)\n` +

      `🚨 Emergency: ${
        hospital.emergency
          ? 'Available'
          : 'Not available'
      }\n` +

      `🕐 Open 24x7: ${
        hospital.open24x7
          ? 'Yes'
          : 'No'
      }\n` +

      `🛏️ Beds: ${hospital.beds}\n` +

      `🏅 Accreditation: ${hospital.accreditation}\n` +

      `🩺 Specialties: ${
        hospital.specialties.join(
          ', '
        )
      }\n` +

      `💳 Insurance: ${
        hospital.insurance.join(
          ', '
        )
      }\n\n` +

      'Please confirm cashless treatment and insurance coverage directly with the hospital or insurance provider.'
    );
  }


  private createHospitalListAnswer(
    hospitals: Hospital[]
  ): string {

    const selectedHospitals =
      hospitals.slice(
        0,
        5
      );


    const list =
      selectedHospitals
        .map(
          (
            hospital,
            index
          ) => {
            return (
              `${index + 1}. ${hospital.name}\n` +

              `   📍 ${hospital.city}, ${hospital.state}\n` +

              `   ⭐ ${hospital.rating} | ` +

              `24x7: ${
                hospital.open24x7
                  ? 'Yes'
                  : 'No'
              }`
            );
          }
        )
        .join('\n\n');


    const remainingCount =
      hospitals.length -
      selectedHospitals.length;


    let remainingText = '';


    if (
      remainingCount > 0
    ) {
      remainingText =
        this.language() === 'hi'
          ? `\n\nइसके अलावा ${remainingCount} और matching hospitals मिले।`

          : `\n\n${remainingCount} more matching hospitals were found.`;
    }


    if (
      this.language() === 'hi'
    ) {
      return (
        `मुझे ये अस्पताल मिले:\n\n${list}` +

        remainingText +

        '\n\nकिसी अस्पताल की पूरी जानकारी के लिए नीचे दिए गए profile button को दबाएं।'
      );
    }


    return (
      `I found these hospitals:\n\n${list}` +

      remainingText +

      '\n\nUse the profile buttons below to view complete hospital details.'
    );
  }


  private findBestHospital(
    question: string,

    hospitals: Hospital[]
  ): Hospital | undefined {

    const normalizedQuestion =
      this.normalizeText(
        question
      );


    const tokens =
      this.getImportantTokens(
        normalizedQuestion
      );


    let selectedHospital:
      Hospital | undefined;


    let highestScore = 0;


    for (
      const hospital of hospitals
    ) {
      const hospitalName =
        this.normalizeText(
          hospital.name
        );


      const hospitalCity =
        this.normalizeText(
          hospital.city
        );


      const hospitalState =
        this.normalizeText(
          hospital.state
        );


      let score = 0;


      if (
        normalizedQuestion.includes(
          hospitalName
        )
      ) {
        score += 10;
      }


      for (
        const token of tokens
      ) {
        if (
          hospitalName.includes(
            token
          )
        ) {
          score += 3;
        }


        if (
          hospitalCity.includes(
            token
          )
        ) {
          score += 2;
        }


        if (
          hospitalState.includes(
            token
          )
        ) {
          score += 2;
        }
      }


      if (
        score > highestScore
      ) {
        highestScore =
          score;

        selectedHospital =
          hospital;
      }
    }


    return highestScore >= 3
      ? selectedHospital
      : undefined;
  }


  private findHospitalsByArea(
    question: string,

    hospitals: Hospital[]
  ): Hospital[] {

    const tokens =
      this.getImportantTokens(
        this.normalizeText(
          question
        )
      );


    return hospitals.filter(
      hospital => {
        const location =
          this.normalizeText(
            `${hospital.city} ${hospital.state}`
          );


        return tokens.some(
          token => {
            return location.includes(
              token
            );
          }
        );
      }
    );
  }


  private findMentionedInsurance(
    question: string,

    hospitals: Hospital[]
  ): string | undefined {

    const normalizedQuestion =
      this.normalizeText(
        question
      );


    const providers =
      Array.from(
        new Set(
          hospitals.flatMap(
            hospital => {
              return hospital.insurance;
            }
          )
        )
      );


    return providers.find(
      provider => {
        return normalizedQuestion
          .includes(
            this.normalizeText(
              provider
            )
          );
      }
    );
  }


  private isAreaSearch(
    question: string
  ): boolean {

    const normalized =
      this.normalizeText(
        question
      );


    return [
      'hospital in',
      'hospitals in',
      'hospital near',
      'hospitals near',
      'find hospital',
      'show hospital',
      'अस्पताल बताएं',
      'अस्पताल दिखाएं',
      'अस्पताल खोजें'
    ].some(
      value => {
        return normalized.includes(
          value
        );
      }
    );
  }


  private is24x7Search(
    question: string
  ): boolean {

    const normalized =
      this.normalizeText(
        question
      );


    return (
      normalized.includes(
        '24x7'
      ) ||

      normalized.includes(
        '24 7'
      ) ||

      normalized.includes(
        'open all time'
      ) ||

      normalized.includes(
        'open whole day'
      )
    );
  }


  private isEmergencySearch(
    question: string
  ): boolean {

    const normalized =
      this.normalizeText(
        question
      );


    return (
      normalized.includes(
        'emergency'
      ) ||

      normalized.includes(
        'आपातकालीन'
      ) ||

      normalized.includes(
        'इमरजेंसी'
      )
    );
  }


  private isGreeting(
    question: string
  ): boolean {

    const normalized =
      this.normalizeText(
        question
      );


    return [
      'hi',
      'hello',
      'hey',
      'namaste',
      'नमस्ते',
      'हेलो'
    ].includes(
      normalized
    );
  }


  private async loadInternetInformation(
    searchText: string
  ): Promise<InternetResult | null> {

    const selectedLanguage =
      this.language();


    let result =
      await this.searchWikipedia(
        searchText,

        selectedLanguage
      );


    if (
      !result &&
      selectedLanguage === 'hi'
    ) {
      result =
        await this.searchWikipedia(
          searchText,

          'en'
        );
    }


    return result;
  }


  private async searchWikipedia(
    searchText: string,

    language: ChatLanguage
  ): Promise<InternetResult | null> {

    const apiUrl =
      `https://${language}.wikipedia.org/w/api.php`;


    const params =
      new HttpParams()

        .set(
          'action',
          'query'
        )

        .set(
          'generator',
          'search'
        )

        .set(
          'gsrsearch',
          searchText
        )

        .set(
          'gsrlimit',
          '1'
        )

        .set(
          'prop',
          'extracts|info'
        )

        .set(
          'exintro',
          '1'
        )

        .set(
          'explaintext',
          '1'
        )

        .set(
          'inprop',
          'url'
        )

        .set(
          'format',
          'json'
        )

        .set(
          'origin',
          '*'
        );


    try {
      const response =
        await firstValueFrom(
          this.http
            .get<WikipediaResponse>(
              apiUrl,

              {
                params
              }
            )
            .pipe(
              timeout(8000)
            )
        );


      const pages =
        Object.values(
          response.query
            ?.pages ?? {}
        );


      const page =
        pages[0];


      if (
        !page?.extract
      ) {
        return null;
      }


      const summary =
        page.extract.length > 700
          ? (
              `${page.extract.substring(
                0,
                700
              )}...`
            )

          : page.extract;


      return {
        title:
          page.title,

        summary,

        url:
          page.fullurl ??

          (
            `https://${language}.wikipedia.org/wiki/` +

            encodeURIComponent(
              page.title
            )
          )
      };

    } catch {
      return null;
    }
  }


  private prepareQuestion(
    question: string
  ): string {

    let preparedQuestion =
      question.toLowerCase();


    const hindiAliases:
      Record<string, string> = {

      'नई दिल्ली':
        'new delhi',

      'दिल्ली':
        'delhi',

      'मुंबई':
        'mumbai',

      'बेंगलुरु':
        'bengaluru',

      'बैंगलोर':
        'bengaluru',

      'हैदराबाद':
        'hyderabad',

      'चेन्नई':
        'chennai',

      'कोलकाता':
        'kolkata',

      'भुवनेश्वर':
        'bhubaneswar',

      'पुणे':
        'pune',

      'अहमदाबाद':
        'ahmedabad',

      'जयपुर':
        'jaipur',

      'लखनऊ':
        'lucknow',

      'पटना':
        'patna',

      'भोपाल':
        'bhopal',

      'इंदौर':
        'indore',

      'नागपुर':
        'nagpur',

      'गुवाहाटी':
        'guwahati',

      'देहरादून':
        'dehradun',

      'रांची':
        'ranchi',

      'रायपुर':
        'raipur',

      'अपोलो':
        'apollo',

      'एम्स':
        'aiims',

      'फोर्टिस':
        'fortis',

      'मैक्स':
        'max',

      'केयर':
        'care'
    };


    const aliases =
      Object.keys(
        hindiAliases
      )
        .sort(
          (
            first,
            second
          ) => {
            return (
              second.length -
              first.length
            );
          }
        );


    for (
      const alias of aliases
    ) {
      preparedQuestion =
        preparedQuestion
          .split(alias)

          .join(
            hindiAliases[
              alias
            ]
          );
    }


    return preparedQuestion;
  }


  private getImportantTokens(
    text: string
  ): string[] {

    const ignoredWords =
      new Set([
        'the',
        'a',
        'an',
        'is',
        'are',
        'in',
        'at',
        'near',
        'about',
        'please',
        'tell',
        'me',
        'show',
        'find',
        'hospital',
        'hospitals',
        'details',
        'information',
        'open',
        'का',
        'की',
        'के',
        'में',
        'से',
        'और',
        'मुझे',
        'बताएं',
        'दिखाएं',
        'खोजें',
        'जानकारी',
        'अस्पताल'
      ]);


    return text
      .split(/\s+/)

      .filter(
        token => {
          return (
            token.length > 2 &&

            !ignoredWords.has(
              token
            )
          );
        }
      );
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
        1,

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


  private normalizeText(
    value: string
  ): string {

    return value
      .toLowerCase()

      .replace(
        /[^\p{L}\p{N}\s]/gu,

        ' '
      )

      .replace(
        /\s+/g,

        ' '
      )

      .trim();
  }
}