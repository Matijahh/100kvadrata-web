import type { ReactNode } from "react";
import type { Locale } from "@/i18n/routing";

const OFFICE = "office@100-kvadrata.rs";

export type LegalDoc = {
  title: string;
  description: string;
  h1: string;
  body: ReactNode;
};

/* --------------------------------------------------------- privacy --- */

const privacySr: LegalDoc = {
  title: "Politika privatnosti — 100m²",
  description: "Kako 100m² prikuplja i koristi tvoje podatke.",
  h1: "Politika privatnosti",
  body: (
    <>
      <p>
        Ova politika objašnjava koje podatke aplikacija 100m² prikuplja, zašto
        ih prikuplja i šta ti možeš da uradiš s njima. Pisana je da bude
        razumljiva. Ako ti nešto nije jasno, piši nam na{" "}
        <a href={`mailto:${OFFICE}`}>{OFFICE}</a>.
      </p>

      <h2>Koje podatke prikupljamo</h2>

      <p>
        <strong>Podaci naloga.</strong> Kada napraviš nalog, čuvamo tvoju imejl
        adresu, korisničko ime i lozinku u kriptovanom obliku. Ako se prijaviš
        preko Google ili Apple naloga, od njih dobijamo tvoju imejl adresu i
        ime. Lozinku nikada ne vidimo.
      </p>

      <p>
        <strong>Profil.</strong> Ime, profilna fotografija i ostali podaci koje
        sam uneseš na profilu.
      </p>

      <p>
        <strong>Oglasi.</strong> Fotografije, video snimci, cena, lokacija,
        kvadratura i opis koje uneseš kada postavljaš oglas. Ovi podaci su
        vidljivi drugim korisnicima aplikacije.
      </p>

      <p>
        <strong>Poruke.</strong> Sadržaj razgovora koje vodiš sa drugim
        korisnicima, uključujući fotografije koje pošalješ u poruci.
      </p>

      <p>
        <strong>Podešavanja.</strong> Filteri pretrage, sačuvane pretrage,
        sačuvani oglasi, jezik i tema aplikacije.
      </p>

      <p>
        <strong>Obaveštenja.</strong> Ako uključiš push obaveštenja, čuvamo
        token uređaja koji je potreban da bismo ti poslali obaveštenje.
      </p>

      <p>
        <strong>Prijave i blokiranja.</strong> Kada prijaviš oglas ili
        korisnika, ili nekoga blokiraš, čuvamo tu radnju kako bismo mogli da
        postupimo po prijavi.
      </p>

      <h2>Zašto ih koristimo</h2>
      <ul>
        <li>Da bi aplikacija radila - prikaz oglasa, poruke, obaveštenja.</li>
        <li>Da bismo te povezali sa kupcima, prodavcima i podstanarima.</li>
        <li>Da bismo održali bezbednost platforme i postupili po prijavama.</li>
        <li>Da bismo odgovorili kada nam se obratiš za podršku.</li>
      </ul>

      <p>
        Tvoje podatke <strong>ne prodajemo</strong> i ne koristimo ih za reklame
        trećih lica.
      </p>

      <h2>Ko još ima pristup</h2>

      <p>
        Koristimo Supabase za bazu podataka, autentifikaciju i skladištenje
        fotografija, i Expo za slanje push obaveštenja. Ovi pružaoci usluga
        obrađuju podatke isključivo u naše ime.
      </p>

      <p>
        Podaci koje sam objaviš (oglas, profil, korisničko ime) vidljivi su
        ostalim korisnicima aplikacije. Sve ostalo nije.
      </p>

      <h2>Koliko dugo ih čuvamo</h2>

      <p>Podatke naloga čuvamo dok ti nalog postoji.</p>

      <h2>Brisanje naloga</h2>

      <p>
        Nalog možeš obrisati u samoj aplikaciji, u meniju profila. Brisanjem
        naloga uklanjaju se tvoj profil, oglasi i poruke.
      </p>

      <h2>Tvoja prava</h2>

      <p>
        Imaš pravo da tražiš pristup svojim podacima, njihovu ispravku ili
        brisanje, kao i da uložiš prigovor na obradu. Zahtev pošalji na{" "}
        <a href={`mailto:${OFFICE}`}>{OFFICE}</a>.
      </p>

      <p>
        Ako smatraš da tvoje podatke ne obrađujemo u skladu sa zakonom, možeš se
        obratiti Povereniku za informacije od javnog značaja i zaštitu podataka
        o ličnosti Republike Srbije.
      </p>

      <h2>Deca</h2>

      <p>
        Aplikacija nije namenjena licima mlađim od 18 godina i svesno ne
        prikupljamo njihove podatke.
      </p>

      <h2>Izmene</h2>

      <p>
        Ako izmenimo ovu politiku, objavićemo novu verziju na ovoj stranici i
        ažurirati datum na vrhu.
      </p>
    </>
  ),
};

const privacyEn: LegalDoc = {
  title: "Privacy Policy — 100m²",
  description: "How the 100m² app collects and uses your data.",
  h1: "Privacy Policy",
  body: (
    <>
      <p>
        This policy explains what data the 100m² app collects, why it collects
        it, and what you can do about it. If anything here is unclear, write to{" "}
        <a href={`mailto:${OFFICE}`}>{OFFICE}</a>.
      </p>

      <h2>What we collect</h2>

      <p>
        <strong>Account data.</strong> When you create an account we store your
        email address, username, and an encrypted form of your password. If you
        sign in with Google or Apple, we receive your email address and name
        from them - we never see your password.
      </p>

      <p>
        <strong>Profile.</strong> Your name, profile photo, and anything else
        you choose to add to your profile.
      </p>

      <p>
        <strong>Listings.</strong> Photos, videos, price, location, floor area
        and description that you enter when posting a listing. This is visible
        to other people using the app.
      </p>

      <p>
        <strong>Messages.</strong> The content of conversations you have with
        other users, including photos sent in a message.
      </p>

      <p>
        <strong>Preferences.</strong> Search filters, saved searches, saved
        listings, app language and theme.
      </p>

      <p>
        <strong>Notifications.</strong> If you turn on push notifications, we
        store the device token needed to send them.
      </p>

      <p>
        <strong>Reports and blocks.</strong> When you report a listing or a
        user, or block someone, we store that action so we can act on it.
      </p>

      <h2>Why we use it</h2>
      <ul>
        <li>To run the app - showing listings, messages, notifications.</li>
        <li>To connect you with buyers, sellers and renters.</li>
        <li>To keep the platform safe and act on reports.</li>
        <li>To reply when you contact support.</li>
      </ul>

      <p>
        We <strong>do not sell</strong> your data and we do not use it for
        third-party advertising.
      </p>

      <h2>Who else has access</h2>

      <p>
        We use Supabase for our database, authentication and photo storage, and
        Expo to deliver push notifications. These providers process data solely
        on our behalf.
      </p>

      <p>
        Anything you publish yourself — your listing, profile and username - is
        visible to other users of the app. Nothing else is.
      </p>

      <h2>How long we keep it</h2>

      <p>Account data is kept for as long as your account exists.</p>

      <h2>Deleting your account</h2>

      <p>
        You can delete your account from inside the app, in the profile menu.
        Deleting your account removes your profile, listings and messages.
      </p>

      <h2>Your rights</h2>

      <p>
        You have the right to request access to your data, to have it corrected
        or deleted, and to object to processing. Send requests to{" "}
        <a href={`mailto:${OFFICE}`}>{OFFICE}</a>.
      </p>

      <p>
        If you believe we are not handling your data lawfully, you can contact
        the Commissioner for Information of Public Importance and Personal Data
        Protection of the Republic of Serbia.
      </p>

      <h2>Children</h2>

      <p>
        The app is not intended for anyone under 18 and we do not knowingly
        collect their data.
      </p>

      <h2>Changes</h2>

      <p>
        If we change this policy, we will publish the new version on this page
        and update the date at the top.
      </p>
    </>
  ),
};

/* ----------------------------------------------------------- terms --- */

const termsSr: LegalDoc = {
  title: "Uslovi korišćenja — 100m²",
  description: "Pravila korišćenja aplikacije 100m².",
  h1: "Uslovi korišćenja",
  body: (
    <>
      <p>
        Korišćenjem aplikacije 100m² prihvataš ova pravila. Ako se s njima ne
        slažeš, nemoj koristiti aplikaciju.
      </p>

      <h2>Šta je 100m²</h2>

      <p>
        100m² je platforma na kojoj korisnici objavljuju oglase za prodaju i
        izdavanje nekretnina i međusobno stupaju u kontakt. Mi nismo agencija za
        nekretnine, nismo strana u ugovoru između korisnika i ne posredujemo u
        transakcijama.
      </p>

      <h2>Nalog</h2>

      <ul>
        <li>Za korišćenje aplikacije moraš imati najmanje 18 godina.</li>
        <li>Podaci koje uneseš prilikom registracije moraju biti tačni.</li>
        <li>Odgovoran si za čuvanje pristupnih podataka svog naloga.</li>
        <li>Nalog možeš obrisati u bilo kom trenutku, u meniju profila.</li>
      </ul>

      <h2>Sadržaj koji objavljuješ</h2>

      <p>
        Ti si odgovoran za sve što objaviš - fotografije, video snimke, opise i
        poruke. Objavljivanjem potvrđuješ da imaš pravo na taj sadržaj i daješ
        nam dozvolu da ga prikazujemo unutar aplikacije.
      </p>

      <p>
        <strong>
          Postoji nulta tolerancija prema uvredljivom sadržaju i prema nasilnim
          korisnicima.
        </strong>{" "}
        Sadržaj koji je uvredljiv, nepristojan, govor mržnje, preteći,
        uznemiravajući ili na drugi način neprimeren nije dozvoljen nigde u
        aplikaciji 100m² — ni u oglasima, ni na fotografijama i video snimcima,
        ni u porukama. Nalozi koji objavljuju takav sadržaj ili zlostavljaju
        druge korisnike biće uklonjeni.
      </p>

      <p>Nije dozvoljeno objavljivati:</p>

      <ul>
        <li>lažne oglase ili nekretnine kojima ne raspolažeš;</li>
        <li>netačne podatke o ceni, kvadraturi ili lokaciji;</li>
        <li>tuđe fotografije bez dozvole;</li>
        <li>uvredljiv, diskriminatoran ili nezakonit sadržaj;</li>
        <li>tuđe lične podatke bez pristanka;</li>
        <li>reklame i sadržaj koji nije u vezi sa nekretninama.</li>
      </ul>

      <h2>Prijave i uklanjanje sadržaja</h2>

      <p>
        Svaki oglas i svakog korisnika možeš prijaviti ili blokirati direktno u
        aplikaciji. Blokiranjem korisnika njegovi oglasi i poruke odmah nestaju
        iz tvog feeda. Aplikacija takođe automatski filtrira uvredljive reči i
        neće objaviti oglas niti poslati poruku koja ih sadrži. Prijave
        pregledamo, uklanjamo sadržaj koji krši ova pravila i ograničavamo ili
        ukidamo naloge koji ih krše.
      </p>

      <h2>Cena</h2>

      <p>
        Korišćenje aplikacije je trenutno besplatno. Ako u budućnosti uvedemo
        naplatu pojedinih funkcija, o tome ćemo te obavestiti unapred.
      </p>

      <h2>Odgovornost</h2>

      <p>
        Oglase objavljuju korisnici i mi ne proveravamo njihovu tačnost. Pre
        bilo kakvog dogovora ili plaćanja proveri nekretninu i drugu stranu.
      </p>

      <h2>Izmene usluge i uslova</h2>

      <p>
        Možemo menjati funkcionalnosti aplikacije i ove uslove. Nova verzija se
        objavljuje na ovoj stranici sa izmenjenim datumom.
      </p>

      <h2>Merodavno pravo</h2>

      <p>Na ove uslove primenjuje se pravo Republike Srbije.</p>

      <h2>Kontakt</h2>

      <p>
        Pitanja šalji na <a href={`mailto:${OFFICE}`}>{OFFICE}</a>.
      </p>
    </>
  ),
};

const termsEn: LegalDoc = {
  title: "Terms of Service — 100m²",
  description: "The rules for using the 100m² app.",
  h1: "Terms of Service",
  body: (
    <>
      <p>
        By using the 100m² app you accept these terms. If you do not agree with
        them, please do not use the app.
      </p>

      <h2>What 100m² is</h2>

      <p>
        100m² is a platform where users post listings to sell or rent property
        and get in touch with each other. We are not an estate agency, we are
        not a party to any agreement between users, and we do not broker
        transactions.
      </p>

      <h2>Your account</h2>

      <ul>
        <li>You must be at least 18 years old to use the app.</li>
        <li>The details you provide at registration must be accurate.</li>
        <li>You are responsible for keeping your login details secure.</li>
        <li>You can delete your account at any time from the profile menu.</li>
      </ul>

      <h2>Content you post</h2>

      <p>
        You are responsible for everything you post - photos, videos,
        descriptions and messages. By posting, you confirm you have the right to
        that content and give us permission to display it inside the app.
      </p>

      <p>
        <strong>
          There is zero tolerance for objectionable content and for abusive
          users.
        </strong>{" "}
        Content that is offensive, obscene, hateful, threatening, harassing or
        otherwise objectionable is not permitted anywhere in 100m² - in
        listings, photos, videos or chat messages. Accounts that post such
        content, or that abuse other users, are removed.
      </p>

      <p>You may not post:</p>

      <ul>
        <li>fake listings, or property you have no right to offer;</li>
        <li>inaccurate price, floor area or location details;</li>
        <li>other people&apos;s photos without permission;</li>
        <li>abusive, discriminatory or unlawful content;</li>
        <li>other people&apos;s personal data without their consent;</li>
        <li>advertising or content unrelated to property.</li>
      </ul>

      <h2>Reports and content removal</h2>

      <p>
        You can report or block any listing or user directly in the app.
        Blocking a user immediately removes their listings and messages from
        your feed. The app also filters offensive language automatically and
        refuses to publish listings or send messages that contain it. We review
        reports, remove content that breaches these rules, and restrict or close
        accounts that breach them.
      </p>

      <h2>Cost</h2>

      <p>
        The app is currently free to use. If we introduce charges for any
        feature in future, we will tell you in advance.
      </p>

      <h2>Liability</h2>

      <p>
        Listings are posted by users and we do not verify their accuracy. Check
        the property and the other party before making any agreement or payment.
      </p>

      <h2>Changes to the service and these terms</h2>

      <p>
        We may change the app&apos;s features and these terms. New versions are
        published on this page with an updated date.
      </p>

      <h2>Governing law</h2>

      <p>These terms are governed by the law of the Republic of Serbia.</p>

      <h2>Contact</h2>

      <p>
        Send questions to <a href={`mailto:${OFFICE}`}>{OFFICE}</a>.
      </p>
    </>
  ),
};

export const privacy: Record<Locale, LegalDoc> = { sr: privacySr, en: privacyEn };
export const terms: Record<Locale, LegalDoc> = { sr: termsSr, en: termsEn };
