// Owns everything the settings screen says. Three of its four rows are also on
// the main screen and that duplication is deliberate: the main screen is for
// the choice made in the field, this one for the choice made once.

function byId(id) {
  return document.getElementById(id);
}

export function createSettings(strings) {
  const nodes = {
    screen: byId('settingsScreen'),
    close: byId('closeSettings'),
    title: byId('settingsTitle'),
    runLengthLabel: byId('runLengthLabel'),
    modeFifteen: byId('modeFifteen'),
    modeContinuous: byId('modeContinuous'),
    modeAllDay: byId('modeAllDay'),
    middayLabel: byId('middayLabel'),
    middayReasonLine: byId('middayReasonLine'),
    densityFewer: byId('densityFewer'),
    densitySame: byId('densitySame'),
    trackLabel: byId('trackLabel'),
    trackNote: byId('trackNote'),
    trackChip: byId('settingsTrackChip'),
    languageLabel: byId('languageLabel'),
    nepali: byId('settingsNepali'),
    english: byId('settingsEnglish'),
    volumeLine: byId('settingsVolumeLine'),
  };

  const modeChips = {
    fifteen: nodes.modeFifteen,
    continuous: nodes.modeContinuous,
    allDay: nodes.modeAllDay,
  };

  const densityChips = {
    fewer: nodes.densityFewer,
    same: nodes.densitySame,
  };

  function choose(chips, chosen) {
    for (const key of Object.keys(chips)) chips[key].classList.toggle('chosen', key === chosen);
  }

  function paint(view) {
    nodes.close.setAttribute('aria-label', strings.text('back'));
    nodes.title.textContent = strings.text('settings');

    nodes.runLengthLabel.textContent = strings.text('runLength');
    nodes.modeFifteen.textContent = strings.text('duration');
    nodes.modeContinuous.textContent = strings.text('modeContinuous');
    nodes.modeAllDay.textContent = strings.text('modeAllDay');
    choose(modeChips, view.runMode);

    nodes.middayLabel.textContent = strings.text('midday');
    nodes.middayReasonLine.textContent = strings.text('middayReason');
    nodes.densityFewer.textContent = strings.text('fewer');
    nodes.densitySame.textContent = strings.text('same');
    choose(densityChips, view.middayDensity);

    nodes.trackLabel.textContent = strings.text('track');
    nodes.trackNote.textContent = strings.text('backToAuto');
    nodes.trackChip.textContent = `${strings.text('track')} ${strings.number(view.trackNumber)}`;
    nodes.trackChip.classList.toggle('chosen', view.manual);

    nodes.languageLabel.textContent = strings.text('language');
    nodes.nepali.setAttribute('aria-pressed', String(view.locale === 'ne'));
    nodes.english.setAttribute('aria-pressed', String(view.locale === 'en'));

    nodes.volumeLine.textContent = strings.text('volume');
  }

  return { paint, nodes };
}
