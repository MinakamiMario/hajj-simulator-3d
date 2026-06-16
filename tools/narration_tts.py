#!/usr/bin/env python3
# Spreekt de reisbegeleider-narratie in met VoxCPM en schrijft per regel een wav
# naar assets/audio/gids/scene{N}_{i}.wav (die de game via GidsAudio afspeelt).
#
# Draaien met de VoxCPM-venv:
#   /Users/oussama/code/voxcpm-tool/venv/bin/python tools/narration_tts.py            # alles
#   ... tools/narration_tts.py --scene 6                                              # één scène
#   ... tools/narration_tts.py --limit 1                                              # smoke-test (1 clip)
#   ... tools/narration_tts.py --reference stem.wav --reference-text "..."            # eigen stem (cloning)
import os, re, sys, argparse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NARR_JS = os.path.join(ROOT, 'js', '14-narration.js')
OUT_DIR = os.path.join(ROOT, 'assets', 'audio', 'gids')


def parse_narration(path):
    """Haalt {scene_id: [regels...]} uit het NARRATION-object in de JS."""
    src = open(path, encoding='utf-8').read()
    m = re.search(r'const NARRATION\s*=\s*\{(.*?)\n\};', src, re.S)
    if not m:
        raise SystemExit('NARRATION-blok niet gevonden in ' + path)
    block = m.group(1)
    scenes = {}
    for sm in re.finditer(r'(\d+)\s*:\s*\[(.*?)\]', block, re.S):
        sid = int(sm.group(1))
        lines = re.findall(r'"((?:[^"\\]|\\.)*)"', sm.group(2))
        scenes[sid] = [l.encode().decode('unicode_escape') if '\\' in l else l for l in lines]
    return scenes


def parse_say(path):
    """Gesproken overrides {'scene_idx': arabisch-schrift-tekst} uit NARRATION_SAY."""
    src = open(path, encoding='utf-8').read()
    m = re.search(r'const NARRATION_SAY\s*=\s*\{(.*?)\n\};', src, re.S)
    if not m:
        return {}
    return dict(re.findall(r"'(\d+_\d+)'\s*:\s*\"((?:[^\"\\]|\\.)*)\"", m.group(1)))


def clean(text):
    """Maakt de tekst geschikt voor TTS (honorific-symbool weg, witruimte netjes)."""
    text = text.replace('ﷺ', '').replace('ﷺ', '')
    return re.sub(r'\s+', ' ', text).strip()


def main():
    ap = argparse.ArgumentParser(description='VoxCPM-narratie voor de Hajj-game')
    ap.add_argument('--scene', type=int, help='alleen deze scène (id)')
    ap.add_argument('--limit', type=int, help='stop na N clips (smoke-test)')
    ap.add_argument('--device', default=None, help='cpu / mps / cuda (auto als leeg)')
    ap.add_argument('--cfg', type=float, default=2.0)
    ap.add_argument('--steps', type=int, default=14)
    ap.add_argument('--control', default='',
                    help="voice-design instructie (bv. 'a calm, slow, warm male guide, unhurried'). "
                         "Wordt als (control) vóór de tekst gezet. Niet samen met --reference.")
    ap.add_argument('--reference', help='eigen referentie-audio voor stem-cloning (consistente stem; wav)')
    ap.add_argument('--reference-text', help='tekst die in de referentie-audio gezegd wordt')
    ap.add_argument('--no-seed', action='store_true',
                    help='geen seed-stem maken; elke regel los genereren (minder consistent)')
    ap.add_argument('--seed-text',
                    default="Welkom op je reis. Loop rustig met me mee; onderweg vertel ik je "
                            "wat je ziet en wat je doet, stap voor stap, met aandacht.",
                    help='zin waarmee de seed-stem wordt vastgelegd (gekloond voor alle regels)')
    ap.add_argument('--overwrite', action='store_true', help='bestaande clips opnieuw maken')
    args = ap.parse_args()
    if not args.control:
        args.control = '(a calm, warm, slow male tour guide voice, unhurried, gentle and reverent)'

    scenes = parse_narration(NARR_JS)
    say = parse_say(NARR_JS)
    os.makedirs(OUT_DIR, exist_ok=True)

    import soundfile as sf
    from voxcpm import VoxCPM
    print('VoxCPM laden... (eenmalig)')
    model = VoxCPM.from_pretrained(device=args.device)
    sr = model.tts_model.sample_rate
    print('  klaar — sample rate %d Hz' % sr)

    # --- bepaal de verteller-stem ---
    # Voorrang: eigen referentie > seed-stem (gegenereerd + gekloond) > los per regel.
    ref_wav, ref_text = args.reference, args.reference_text
    if not ref_wav and not args.no_seed:
        seed_wav = os.path.join(OUT_DIR, '_seed.wav')
        ref_text = re.sub(r'\s+', ' ', args.seed_text).strip()
        if os.path.exists(seed_wav) and not args.overwrite:
            print('Seed-stem hergebruiken: %s' % seed_wav)
        else:
            print('Seed-stem genereren (warm, rustig)...')
            seed_audio = model.generate(text='(%s)%s' % (args.control, ref_text),
                                        cfg_value=args.cfg, inference_timesteps=args.steps, normalize=True)
            sf.write(seed_wav, seed_audio, sr)
            print('  seed klaar: %s' % seed_wav)
        ref_wav = seed_wav
    cloning = bool(ref_wav and ref_text)
    print('Modus: %s' % ('cloning vanaf seed/referentie (consistente stem)' if cloning else 'voice-design per regel'))

    made = 0
    ids = [args.scene] if args.scene is not None else sorted(scenes)
    for sid in ids:
        for i, line in enumerate(scenes.get(sid, [])):
            out = os.path.join(OUT_DIR, 'scene%d_%d.wav' % (sid, i))
            if os.path.exists(out) and not args.overwrite:
                print('  overslaan (bestaat): %s' % os.path.basename(out)); continue
            key = '%d_%d' % (sid, i)
            txt = clean(say.get(key, line))                          # Arabisch-schrift override indien aanwezig
            # bij cloning komt het tempo uit de seed → geen control-prefix (mag niet samen met prompt_text)
            speak = txt if cloning else '(%s)%s' % (args.control, txt)
            print('  scene%d_%d%s  «%s…»' % (sid, i, ' [ar]' if key in say else '', txt[:44]))
            kw = dict(text=speak, cfg_value=args.cfg, inference_timesteps=args.steps, normalize=True)
            if cloning:
                kw['prompt_wav_path'] = ref_wav; kw['prompt_text'] = ref_text
            audio = model.generate(**kw)
            sf.write(out, audio, sr)
            made += 1
            if args.limit and made >= args.limit:
                print('limiet bereikt (%d).' % made); return
    print('klaar — %d clip(s) geschreven naar %s' % (made, OUT_DIR))


if __name__ == '__main__':
    main()
