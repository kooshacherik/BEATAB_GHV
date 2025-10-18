import pandas as pd
import librosa

# def audio_to_dataframe(file_path):
#     # Load audio file
#     y, sr = librosa.load(file_path, sr=None)  # sr=None preserves original sample rate
    
#     # Create a DataFrame with time and amplitude
#     df = pd.DataFrame({
#         'time': librosa.times_like(y, sr=sr),
#         'amplitude': y
#     })
#     return df

# # Example usage:
# df = audio_to_dataframe('D:\\modern-portfolio-main\\public\\beats\\beat1.mp3')

# print(df)
# print(df.head())


# import pandas as pd
# import librosa
# import numpy as np

# def freq_to_note(freq):
#     """Convert frequency in Hz to the nearest musical note."""
#     if freq is None or np.isnan(freq) or freq <= 0:
#         return None
#     # Reference: A4 = 440 Hz
#     A4 = 440.0
#     # Calculate the number of semitones from A4
#     semitones_from_A4 = 12 * np.log2(freq / A4)
#     # Round to nearest semitone
#     semitone_index = int(round(semitones_from_A4))
#     # Note names
#     notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
#     # Calculate octave number
#     octave = 4 + (semitone_index // 12)
#     note_index = semitone_index % 12
#     note_name = notes[note_index]
#     return f"{note_name}{octave}"

# def audio_to_notes_dataframe(file_path):
#     # Load audio file
#     y, sr = librosa.load(file_path, sr=None)
#     print('1')
#     # Use PYIN for pitch detection
#     f0, voiced_flag, voiced_probs = librosa.pyin(y, fmin=librosa.note_to_hz('C2'), fmax=librosa.note_to_hz('C7'))
#     print('2')
#     # Generate time array
#     times = librosa.times_like(f0, sr=sr)
#     print('3')    
#     # Convert frequency to note names, handle unvoiced frames
#     notes = [freq_to_note(freq) for freq in f0]
#     print('4')    
#     # Create DataFrame
#     df = pd.DataFrame({
#         'time': times,
#         # 'amplitude':y,
#         'frequency': f0,
#         'note': notes,
#         'voiced': voiced_flag
#     })
#     return df


# # Example usage
# df_notes = audio_to_notes_dataframe('D:\\modern-portfolio-main\\public\\beats\\beat1.mp3')
# print(df_notes)

# # Filter rows where 'voiced' is True
# df_voiced_only = df_notes[df_notes['voiced']]

# # Display the first few rows
# print(df_voiced_only)


# unique_notes = df_voiced_only['note'].unique()
# print(unique_notes)
# print(len(unique_notes))

# unique_frequency = df_voiced_only['frequency'].unique()
# print(unique_frequency)
# print(len(unique_frequency))
















# import librosa
# import numpy as np
# import pretty_midi
# import crepe

# def audio_to_midi_advanced(audio_path, output_midi_path):
#     # Load audio file
#     y, sr = librosa.load(audio_path, sr=None)
    
#     # Run crepe for pitch detection with model_capacity and viterbi smoothing
#     time, frequency, confidence, activation = crepe.predict(y, sr, step_size=10, model_capacity='full', viterbi=True, verbose=0)
    
#     # Convert frequency to MIDI notes
#     midi_notes = []
#     prev_note = None
#     note_start_time = None
#     confidence_threshold = 0.2
    
#     for t, freq, conf in zip(time, frequency, confidence):
#         if conf > confidence_threshold and freq != 0:
#             midi_note = int(np.round(librosa.hz_to_midi(freq)))
#             if prev_note != midi_note:
#                 # Close previous note
#                 if prev_note is not None:
#                     midi_notes.append((prev_note, note_start_time, t))
#                 prev_note = midi_note
#                 note_start_time = t
#         else:
#             if prev_note is not None:
#                 midi_notes.append((prev_note, note_start_time, t))
#                 prev_note = None
    
#     # Create MIDI
#     midi = pretty_midi.PrettyMIDI()
#     instrument = pretty_midi.Instrument(program=pretty_midi.instrument_name_to_program('Acoustic Grand Piano'))
    
#     for note, start, end in midi_notes:
#         if end - start > 0.05:
#             midi_note = pretty_midi.Note(velocity=100, pitch=note, start=start, end=end)
#             instrument.notes.append(midi_note)
    
#     midi.instruments.append(instrument)
#     midi.write(output_midi_path)
#     print(f"MIDI saved to {output_midi_path}")

# # Usage:
# audio_path = 'D:\\modern-portfolio-main\\public\\beats\\beat1.mp3'
# output_midi_path = 'better_output.mid'
# audio_to_midi_advanced(audio_path, output_midi_path)




















# import os
# import librosa
# import numpy as np
# import pretty_midi
# import sounddevice as sd
# import matplotlib.pyplot as plt
# import threading
# import time
# # Step 1: Convert audio to MIDI (as you've done)
# def audio_to_midi(audio_path, output_midi_path):
#     y, sr = librosa.load(audio_path, sr=None)
#     pitches, magnitudes = librosa.core.piptrack(y=y, sr=sr)
#     midi_notes = []
#     current_note = None
#     start_time = 0
#     time_per_frame = len(y) / sr / pitches.shape[1]
#     for i in range(pitches.shape[1]):
#         index = np.argmax(magnitudes[:, i])
#         pitch = pitches[index, i]
#         if pitch > 0:
#             midi_note = int(np.round(librosa.hz_to_midi(pitch)))
#             if current_note != midi_note:
#                 if current_note is not None:
#                     midi_notes.append((current_note, start_time, i * time_per_frame))
#                 current_note = midi_note
#                 start_time = i * time_per_frame
#         else:
#             if current_note is not None:
#                 midi_notes.append((current_note, start_time, i * time_per_frame))
#                 current_note = None
#     # Save MIDI
#     midi = pretty_midi.PrettyMIDI()
#     instrument = pretty_midi.Instrument(program=0)  # Acoustic Grand Piano
#     for note, start, end in midi_notes:
#         if end - start > 0.05:
#             midi_note = pretty_midi.Note(velocity=100, pitch=note, start=start, end=end)
#             instrument.notes.append(midi_note)
#     midi.instruments.append(instrument)
#     midi.write(output_midi_path)
#     return output_midi_path

# # Step 2: Load MIDI and prepare data for visualization
# def load_midi_notes(midi_path):
#     midi_data = pretty_midi.PrettyMIDI(midi_path)
#     notes_by_time = []  # Will be a list of sets of active notes at each time step
#     duration = midi_data.get_end_time()
#     time_step = 0.05  # 50 ms per step
#     times = np.arange(0, duration, time_step)

#     for t in times:
#         active_notes = set()
#         for instrument in midi_data.instruments:
#             for note in instrument.notes:
#                 if note.start <= t <= note.end:
#                     active_notes.add(note.pitch)
#         notes_by_time.append(active_notes)
#     return times, notes_by_time

# # Step 3: Play audio and visualize MIDI notes simultaneously
# def play_and_visualize(audio_path, midi_path):
#     # Load audio
#     y, sr = librosa.load(audio_path, sr=None)
#     duration = len(y) / sr

#     # Load MIDI note data
#     times, notes_by_time = load_midi_notes(midi_path)

#     # Play audio
#     def audio_playback():
#         sd.play(y, sr)
#         sd.wait()

#     # Start audio in a separate thread
#     threading.Thread(target=audio_playback).start()



#     # During playback, print active notes' names
#     for idx in range(len(times)):
#         active_pitches = notes_by_time[idx]
#         # Convert pitches to note names
#         note_names = [pretty_midi.note_number_to_name(pitch) for pitch in sorted(active_pitches)]
#         # Print the current time and notes
#         print(f"Time {times[idx]:.2f}s: {' '.join(note_names)}")
#         time.sleep(0.05)

# # Main execution
# audio_path = 'D:\\modern-portfolio-main\\public\\beats\\beat1.mp3'  # Replace with your file path
# output_midi_path = 'better_output.mid'
# # Convert and save MIDI
# # audio_to_midi(audio_path, output_midi_path)

# # Play audio and visualize MIDI notes
# play_and_visualize(audio_path, output_midi_path)



















import librosa
import sounddevice as sd
import numpy as np
import threading
import time
# def detect_beats(audio_path):
#     # Load the audio file
#     y, sr = librosa.load(audio_path, sr=None)
    
#     # Perform beat tracking
#     tempo, beat_frames = librosa.beat.beat_track(y=y, sr=sr)
    
#     # Convert beat frames to timestamps
#     beat_times = librosa.frames_to_time(beat_frames, sr=sr)
    
#     return beat_times

# Example usage:
audio_path = 'D:\\modern-portfolio-main\\public\\beats\\beat1.mp3'  # Replace with your file path
# beats = detect_beats(audio_path)

# print("Detected beat start times (in seconds):")
# for beat in beats:
#     print(f"{beat:.3f}")



# import librosa
# import librosa.display
# import matplotlib.pyplot as plt
# import numpy as np

# def analyze_rhythms(audio_path):
#     # Load audio
#     y, sr = librosa.load(audio_path, sr=None)

#     # Beat tracking
#     tempo, beat_frames = librosa.beat.beat_track(y=y, sr=sr)
#     beat_times = librosa.frames_to_time(beat_frames, sr=sr)

#     # Onset detection (can correspond to snare hits)
#     onset_env = librosa.onset.onset_strength(y=y, sr=sr)
#     onset_frames = librosa.onset.onset_detect(onset_envelope=onset_env, sr=sr)
#     onset_times = librosa.frames_to_time(onset_frames, sr=sr)

#     # # Plot waveform
#     # plt.figure(figsize=(14, 8))
#     # plt.subplot(2,1,1)
#     # librosa.display.waveshow(y, sr=sr, alpha=0.6)
#     # plt.title("Waveform with Detected Beats and Onsets")
    
#     # # Plot detected beats
#     # plt.vlines(beat_times, ymin=-1, ymax=1, color='r', linestyle='--', label='Beats')
    
#     # # Plot detected onsets (possible snare hits)
#     # plt.vlines(onset_times, ymin=-1, ymax=1, color='g', linestyle=':', label='Onsets (Snare/Other)')
    
#     # plt.legend()
    
#     # # Plot spectral features for visualization
#     # plt.subplot(2, 1, 2)
#     # D = librosa.amplitude_to_db(np.abs(librosa.stft(y)), ref=np.max)
#     # librosa.display.specshow(D, sr=sr, x_axis='time', y_axis='log')
#     # plt.colorbar(format='%+2.0f dB')
#     # plt.title('Spectrogram')

#     # plt.tight_layout()
#     # plt.show()
    
#     # Output detected times
#     print("Detected beat times (seconds):")
#     print(beat_times)
#     print("\nDetected onset times (possible snare hits, seconds):")
#     print(onset_times)

#     return beat_times,onset_times , y , sr

# def detect_beats(audio_path):
#     y, sr = librosa.load(audio_path, sr=None)
#     tempo, beat_frames = librosa.beat.beat_track(y=y, sr=sr)
#     beat_times = librosa.frames_to_time(beat_frames, sr=sr)
#     return y, sr, beat_times

# def play_audio(y, sr):
#     sd.play(y, sr)

# def schedule_beats(beat_times,onset_times):
#     start_time = time.time()
#     for beat_time in onset_times:
#         delay = beat_time - (time.time() - start_time)
#         if delay > 0:
#             time.sleep(delay)
#         print("beat")

# # Main function
# def main(audio_path):
#     # y, sr, beat_times = detect_beats(audio_path)
#     beat_times,onset_times,y, sr = analyze_rhythms(audio_path)
#     # Start playing audio in a separate thread
#     threading.Thread(target=play_audio, args=(y, sr)).start()
#     # Schedule printing "beat" at each beat start time
#     schedule_beats(beat_times,onset_times)
#     # Wait until playback finishes
#     sd.wait()

# main(audio_path)


import librosa

def get_bpm(audio_path):
    # Load the audio file
    y, sr = librosa.load(audio_path)
    # Estimate the tempo (BPM)
    tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
    return tempo

# Example usage
# audio_file = 'your_audio_file.mp3'  # or wav, flac, etc.
bpm = get_bpm(audio_path)
print(f"Estimated BPM: {bpm}")