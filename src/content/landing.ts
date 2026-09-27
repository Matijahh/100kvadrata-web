import type { Locale } from "@/i18n/routing";
import type { ChatBubble } from "@/components/PhoneChat";
import type { ReelData } from "@/components/Reel";
import type { StepsContent } from "@/components/Steps";

export type LandingContent = {
  meta: {
    title: string;
    description: string;
    ogTitle: string;
    ogDescription: string;
    ogLocale: string;
  };
  hero: {
    eyebrow: string;
    h1Lines: [string, string, string];
    sub: string;
    lede: string;
  };
  feed: {
    deckAria: string;
    search: string;
    tabsLeft: string;
    tabsRight: string;
    hint: string;
    moreLabel: string;
  };
  reels: ReelData[];
  pitch: { eyebrow: string; h2Before: string; h2Em: string; h2After: string; lede: string };
  buyer: StepsContent;
  owner: StepsContent;
  gallery: {
    eyebrow: string;
    h2: string;
    screenTitle: string;
    chatName: string;
    chatBubbles: ChatBubble[];
    chatField: string;
    note: string;
  };
  last: { eyebrow: string; h2: string; lede: string };
};

const sr: LandingContent = {
  meta: {
    title: "100m² - Jedan svajp bliže tvom novom domu",
    description:
      "Svajp aplikacija za nekretnine. Stanovi, kuće, garaže - svajpuj, sačuvaj i useli se. Dostupno na iOS i Android.",
    ogTitle: "100m² - Jedan svajp bliže tvom novom domu",
    ogDescription:
      "Svajp aplikacija za nekretnine. Stanovi, kuće, garaže - svajpuj, sačuvaj i useli se.",
    ogLocale: "sr_RS",
  },
  hero: {
    eyebrow: "Dostupno na iOS i Android uređajima",
    h1Lines: ["Jedan svajp", "bliže tvom", "novom domu."],
    sub: "Kupi. Prodaj. Iznajmi.",
    lede: "Svajp aplikacija za nekretnine. Stanovi, kuće, garaže - svajpuj, sačuvaj i useli se.",
  },
  feed: {
    deckAria:
      "Pregled stanova — strelicama gore i dole prelaziš na sledeći oglas",
    search: "Pretraži stanove...",
    tabsLeft: "Kupci",
    tabsRight: "Stanovi",
    hint: "Prevuci nagore",
    moreLabel: "Više informacija...",
  },
  reels: [
    {
      photo: "/img/room-1.jpg",
      avatar: "/img/avatar-1.jpg",
      price: { amount: "780€", area: "76m²" },
      likes: "103",
      user: "@darko.trifunovic",
      loc: "Vračar, Beograd",
      desc: "Izdajem komforan stan u samom srcu Vračara, jedne od najtraženijih beogradskih opština...",
      active: 0,
      lazy: false,
    },
    {
      photo: "/img/room-2.jpg",
      avatar: "/img/avatar-2.jpg",
      price: { amount: "148.000€", area: "58m²" },
      likes: "87",
      user: "@milica.pejcic",
      loc: "Zvezdara, Beograd",
      desc: "Dvosoban, renoviran 2024. Mirna ulica, peti sprat sa liftom, blizu Zvezdarske šume...",
      active: 1,
      lazy: true,
    },
    {
      photo: "/img/room-3.jpg",
      avatar: "/img/avatar-3.jpg",
      price: { amount: "420€", area: "44m²" },
      likes: "61",
      user: "@stefan.vlajkovic",
      loc: "Blok 45, Novi Beograd",
      desc: "Jednoiposoban, kompletno namešten, pogled na Savu i garažno mesto u cenu...",
      active: 2,
      lazy: true,
    },
  ],
  pitch: {
    eyebrow: "Zašto 100m²",
    h2Before: "Traženje stana ne mora da bude ",
    h2Em: "dosadno",
    h2After: ".",
    lede: "Mi to menjamo. Zamisli da jednostavno svajpuješ kroz stanove - jedan, pa drugi, pa treći, lako kao kad skroluješ na telefonu. Sviđa ti se? Sačuvaš. Ne sviđa ti se? Ideš dalje.",
  },
  buyer: {
    head: {
      eyebrow: "Tražiš stan",
      h2: "Reci jednom šta ti treba.",
      lede: "Sve posle toga je jedan prst.",
    },
    steps: [
      {
        h3: "Podesi šta tražiš",
        body: "Grad, budžet, broj soba, kvadratura. Podesi samo jednom i čekaj ponudu baš od onog ko ima šta tebi treba.",
      },
      {
        h3: "Svajpuj kroz stanove",
        body: "Lako kao svajpovanje. A sve što si sačuvao čeka te na profilu.",
      },
      {
        h3: "Piši vlasniku",
        body: "Razgovor se otvara u aplikaciji, bez čekanja na poziv i bez ostavljanja broja telefona strancima.",
      },
    ],
  },
  owner: {
    head: {
      eyebrow: "Izdaješ ili prodaješ",
      h2: "Ne čekaj da neko naiđe.",
      lede: "100m² radi u oba smera. I tvoj oglas traži ljude, ne samo oni tebe.",
    },
    steps: [
      {
        h3: "Postavi oglas",
        body: "Slike, video, cena i detalji. Gotovo za nekoliko minuta.",
      },
      {
        h3: "Vidi ko traži",
        body: "Kupci i podstanari objavljuju šta im treba. Ti listaš njihove potrebe isto kao što oni listaju stanove.",
      },
      {
        h3: "Ponudi svoj stan",
        body: "Nekome treba baš tvoj stan? Pošalji mu ponudu direktno, umesto da čekaš da te sam pronađe.",
      },
    ],
  },
  gallery: {
    eyebrow: "Kako izgleda aplikacija",
    h2: "Jednostavno, sve što ti treba.",
    screenTitle: "PORUKE",
    chatName: "Milica",
    chatBubbles: [
      { side: "them", text: "Zdravo! Da li je stan još uvek slobodan?" },
      { side: "me", text: "Jeste. Organizujem obilazak u subotu?" },
      { side: "them", text: "Odlično, odgovara mi pre podne." },
      { side: "me", text: "Dogovoreno, vidimo se u 11h." },
    ],
    chatField: "Napiši poruku...",
    note: "Prikaz izgleda aplikacije.",
  },
  last: {
    eyebrow: "Preuzmi aplikaciju",
    h2: "Počni da svajpuješ.",
    lede: "100m² je besplatna za iPhone i Android. Preuzmi je i pronađi svoj sledeći dom.",
  },
};

const en: LandingContent = {
  meta: {
    title: "100m² - One swipe closer to your new home",
    description:
      "Apartments in Serbia, one at a time. Swipe instead of filling in filters. Now on iOS and Android.",
    ogTitle: "100m² — One swipe closer to your new home",
    ogDescription:
      "Apartments in Serbia, one at a time. Swipe instead of filling in filters.",
    ogLocale: "en_GB",
  },
  hero: {
    eyebrow: "Now on iOS and Android",
    h1Lines: ["One swipe", "closer to your", "new home."],
    sub: "Buy. Sell. Rent.",
    lede: "A swipe app for real estate. Apartments, houses, garages - swipe, save and move in.",
  },
  feed: {
    deckAria:
      "Apartment feed - use the up and down arrow keys to move between listings",
    search: "Search apartments...",
    tabsLeft: "Buyers",
    tabsRight: "Apartments",
    hint: "Drag upwards",
    moreLabel: "More details...",
  },
  reels: [
    {
      photo: "/img/room-1.jpg",
      avatar: "/img/avatar-1.jpg",
      price: { amount: "€780", area: "76m²" },
      likes: "103",
      user: "@darko.trifunovic",
      loc: "Vračar, Belgrade",
      desc: "Renting out a comfortable flat right in the heart of Vračar, one of Belgrade's most sought-after districts...",
      active: 0,
      lazy: false,
    },
    {
      photo: "/img/room-2.jpg",
      avatar: "/img/avatar-2.jpg",
      price: { amount: "€148,000", area: "58m²" },
      likes: "87",
      user: "@milica.pejcic",
      loc: "Zvezdara, Belgrade",
      desc: "Two rooms, renovated in 2024. Quiet street, fifth floor with a lift, close to Zvezdara forest...",
      active: 1,
      lazy: true,
    },
    {
      photo: "/img/room-3.jpg",
      avatar: "/img/avatar-3.jpg",
      price: { amount: "€420", area: "44m²" },
      likes: "61",
      user: "@stefan.vlajkovic",
      loc: "Blok 45, New Belgrade",
      desc: "One and a half rooms, fully furnished, a view of the Sava and a parking space included...",
      active: 2,
      lazy: true,
    },
  ],
  pitch: {
    eyebrow: "Why 100m²",
    h2Before: "Finding a place doesn't have to be ",
    h2Em: "boring",
    h2After: ".",
    lede: "We're changing that. Imagine simply swiping through apartments - one, then another, then a third, as easy as scrolling on your phone. Like it? Save it. Don't? Move on.",
  },
  buyer: {
    head: {
      eyebrow: "Looking for a place",
      h2: "Say what you need, once.",
      lede: "Everything after that is one finger.",
    },
    steps: [
      {
        h3: "Set what you're after",
        body: "City, budget, rooms, floor area. Set it once and wait for an offer from exactly the person who has what you need.",
      },
      {
        h3: "Swipe through apartments",
        body: "As easy as swiping. And everything you've saved is waiting on your profile.",
      },
      {
        h3: "Message the owner",
        body: "The conversation opens in the app - no waiting for a callback, no handing your phone number to strangers.",
      },
    ],
  },
  owner: {
    head: {
      eyebrow: "Selling or renting out",
      h2: "Don't wait to be found.",
      lede: "100m² runs both ways - your listing looks for people too, not just the other way round.",
    },
    steps: [
      {
        h3: "Post your listing",
        body: "Photos, video, price and details. Done in a few minutes.",
      },
      {
        h3: "See who's looking",
        body: "Buyers and renters post what they need. You browse their posts the same way they browse apartments.",
      },
      {
        h3: "Offer them your place",
        body: "Found someone your apartment suits? Send them an offer directly instead of waiting to be found.",
      },
    ],
  },
  gallery: {
    eyebrow: "What it looks like",
    h2: "Simple - everything you need.",
    screenTitle: "MESSAGES",
    chatName: "Milica",
    chatBubbles: [
      { side: "them", text: "Hi! Is the flat still available?" },
      { side: "me", text: "It is. Could you view it on Saturday?" },
      { side: "them", text: "Great, morning works for me." },
      { side: "me", text: "Done - 11am it is." },
    ],
    chatField: "Write a message...",
    note: "Representation of the app interface.",
  },
  last: {
    eyebrow: "Get the app",
    h2: "Start swiping.",
    lede: "100m² is free on iPhone and Android. Download it and find your next home.",
  },
};

export const landing: Record<Locale, LandingContent> = { sr, en };

// The buyer arrow bows left, the owner arrow bows right.
export const BUYER_ARC = "M22,0 C2,26 2,74 22,100";
export const OWNER_ARC = "M22,0 C42,26 42,74 22,100";
