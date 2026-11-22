---
name: video-editor
description: Edit the user's videos and turn one long recording (webinar, podcast, Zoom call, camera rant) into short vertical clips with captions, ready to post. Use when the user shares a video file and asks to edit it, clip it, find the best moments, cut it for social, or add captions.
---

# Video Editor

The user is the director. You propose, they choose, you cut.

## Ground rules

- Work only on a copy. Copy the source into a work folder before any step and never write to, rename or move the original.
- Use `ffmpeg` / `ffprobe` for all cutting, cropping and encoding.
- If brand files exist (fonts, colors, logo, voice or tone notes), read them before styling captions or writing copy. If none exist, ask once where they are, and otherwise use clean, high-contrast defaults.

## Saved preferences

- **Call to action:** _not set yet_ — ask the user once, then replace this line with their answer and never ask again.

## Clip Finder

Use this when the user gives you a long video: a webinar, a podcast, a Zoom recording, or them ranting in their car.

1. **Copy first.** Copy the video to your work folder. Never touch the original.

2. **Transcribe with Whisper.** Write down every word with the time it was said (word-level timestamps). Keep the transcript in the work folder.
   - `faster-whisper` works on CPU: `WhisperModel('small.en', device='cpu', compute_type='int8')`, then `transcribe(audio, word_timestamps=True)`.
   - If it fails opening the file, extract audio first (`ffmpeg -i in.mp4 -ac 1 -ar 16000 audio.wav`) and pass the samples as a float32 numpy array instead of a path.

3. **Find the best five moments.** A good moment:
   - is 30 to 90 seconds long;
   - makes sense to a stranger who saw nothing else;
   - opens with a line that would stop someone scrolling: a strong opinion, a surprising number, a mistake the user made, or a clear how-to.

4. **Cut on sentence boundaries.** Start every clip on the first word of a sentence and end it on the last word of a sentence. Never cut the speaker off mid-word. Use the word timestamps, with a few frames of padding either side.

5. **Show the list before cutting anything.** For each clip give:
   - the opening line;
   - the start and end time;
   - one sentence on why you picked it.

   Then stop and wait for the user to choose.

6. **Cut each approved clip.**
   - Vertical 9:16, with the speaker's face kept in the frame.
   - If the speaker moves around a lot, show one still image of the crop first so the user can check it.
   - Remove any pause longer than half a second.
   - Burn in captions in the user's brand style.

7. **Write a post caption for each clip, in the user's voice.** Use their brand files if they have them. First line is the hook. Last line is the call to action from *Saved preferences* above (ask once if it is not set, then save it there).

8. **Save the clips** in a new folder next to the original, named with today's date (`YYYY-MM-DD`). Number the files in the order you would post them, best one first (`01-…`, `02-…`).

9. **Report back.** Say which clip you would post first and why, and remind the user to watch every clip before posting it.
