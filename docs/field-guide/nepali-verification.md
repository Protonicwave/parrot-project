# Nepali verification sheet

Every Nepali string in the project, beside its English meaning. None has
been checked by a native speaker. Nothing goes to a real farm until one has
been through this sheet.

For each row: if the Nepali is right, tick it. If it is wrong, write what it
should be. Notes on register matter too. This is written for farmers, so
plain spoken Nepali beats formal Nepali everywhere.

Two things to watch for beyond straight translation:

- **Numerals.** The interface uses Devanagari digits throughout, including
  the countdown. Check the digits in these strings read naturally.
- **Length.** Devanagari runs longer than English and the app is one screen
  that must not scroll, so a much longer replacement needs flagging.

## Interface strings

From `app/assets/locales/ne.json`. The key is what the code asks for.

| Key | Nepali | Intended meaning | Correct? |
| --- | --- | --- | --- |
| `appName` | सूर्यमुखी रक्षक | Sunflower Guard |  |
| `play` | बजाउनुहोस् | Play |  |
| `stop` | रोक्नुहोस् | Stop |  |
| `playing` | बज्दै छ | Playing |  |
| `finished` | सकियो | Finished |  |
| `duration` | १५ मिनेट | 15 minutes |  |
| `remaining` | बाँकी | left |  |
| `day` | दिन | Day |  |
| `track` | धुन | Track |  |
| `advisory` | बिहान र साँझमा सबैभन्दा प्रभावकारी | Works best at dawn and dusk |  |
| `backToAuto` | थिच्दै जानुहोस्, स्वचालितमा फर्कन्छ | Keep tapping to return to automatic |  |
| `volume` | स्पिकरको आवाज पूरा बढाउनुहोस् | Keep the speaker at full volume |  |
| `eventsSounded` | {total} मध्ये {done} वटा आवाज बजिसके | {done} of {total} sounded |  |
| `pressAgain` | फेरि बजाउन थिच्नुहोस् | Press again any time you want another run |  |
| `modeContinuous` | लगातार | Continuous |  |
| `modeAllDay` | दिनभर | All day |  |
| `runsUntilStopped` | तपाईंले नरोकेसम्म बज्छ | Runs until you stop it |  |
| `allDaySummary` | दिनभर, दिउँसो कम | All day, quieter at midday |  |
| `elapsed` | चलेको | elapsed |  |
| `soundedToday` | आज {done} वटा आवाज बजिसके | {done} sounded today |  |
| `dawn` | बिहान | Dawn |  |
| `midday` | दिउँसो | Midday |  |
| `dusk` | साँझ | Dusk |  |
| `allDayReason` | सुगा बिहान र साँझ आउँछ, त्यसैले त्यति बेला घना बज्छ | Parakeets come at dawn and dusk, so it plays densely then |  |
| `settings` | सेटिङ | Settings |  |
| `runLength` | कति बेरसम्म बजाउने | How long to play |  |
| `fewer` | कम बजाउने | Fewer |  |
| `same` | बराबर | Same |  |
| `middayReason` | सुगा दिउँसो खेतमा आउँदैन। त्यति बेला कम बजाए आवाजको असर लामो समय रहन्छ। | Parakeets are not in the field at midday. Playing less then keeps the sound working for longer |  |
| `language` | भाषा | Language |  |
| `back` | फर्कनुहोस् | Back |  |

## Field guide

From `docs/field-guide/field-guide.html`, the printed farmer note. The two
sheets are written to say the same thing, so the English column is the
matching line rather than a translation of the Nepali.

| Nepali | Intended meaning | Correct? |
| --- | --- | --- |
| सूर्यमुखीलाई सुगाबाट जोगाउने उपाय | Protecting sunflowers from parakeets |  |
| दूधे अवस्थादेखि कटानीसम्मका ३ देखि ५ हप्ता मात्र जोखिमपूर्ण हुन्छन्। आवाज पाँचमध्ये एक उपाय हो, पाँचै वटा सँगै प्रयोग गर्नुहोस्। | Only the three to five weeks from milk stage to harvest are at risk. Sound is one of these five measures. Use all five together. |  |
| सुगा बस्ने रूखहरूको छेउमा सूर्यमुखी नलगाउनुहोस्। | Do not plant beside the trees the parakeets roost in. |  |
| बथान बिहान जहाँबाट उड्छ, त्यहीँ नजिकको खेत पहिले खाइन्छ। | The field nearest where the flock wakes is the field eaten first. |  |
| तल फर्केको टाउको र लामो पत्र भएका जात छान्नुहोस्। | Choose hybrids with downward facing heads and long bracts. |  |
| निहुरिएको टाउकोमा सुगालाई बस्न ठाउँ हुँदैन। | A head that hangs down gives a parakeet nowhere to perch. |  |
| छिमेकीहरूसँग एकै समयमा रोप्नुहोस्। | Sow in step with your neighbours. |  |
| सबैको बाली सँगै पाक्दा बथान फैलिन्छ र एउटै खेतमा क्षति थुप्रिँदैन। | When everyone ripens together the flock spreads out instead of concentrating on one field. |  |
| स्पिकर खेतको छेउमा, सुगा बस्ने रूखतर्फ फर्काएर राख्नुहोस्। | Put the speaker on the margin, facing the roost. |  |
| क्षति खेतको छेउको ५० मिटरभित्र थुप्रिन्छ, बीचमा प्रायः हुँदैन। | Damage concentrates within 50 m of the edge and is close to zero in the middle. |  |
| बिहान र साँझमा सबैभन्दा प्रभावकारी | Works best at dawn and dusk. |  |
| बथान बिहान र साँझ खेततिर आउँछ। | That is when the flock moves between the roost and the fields. |  |
| स्पिकरको आवाज पूरा बढाउनुहोस् | Keep the speaker at full volume |  |
| सुगाले सूर्यमुखीको २० देखि ५० प्रतिशत बाली खान सक्छ। | Parakeets take 20 to 50 per cent of a sunflower crop, more where the flocks are large. |  |
| आवाजले मात्र करिब आधा क्षति घटाउँछ, त्यसैले अरू उपाय पनि चाहिन्छ। | Sound alone cuts damage by roughly half, so the other four measures still matter. |  |

## After the check

Corrections to interface strings go into `app/assets/locales/ne.json`, which
is the only place the app reads them from. Corrections to the field guide go
into the Nepali sheet of `field-guide.html`. Then remove the unverified
warnings from `README.md` and from the top of the field guide, and strike
question 1 from section 8 of `PLAN.md`.
