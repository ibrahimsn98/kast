package hlsutil

import (
	"strings"
	"testing"
	"time"
)

func TestInjectNowPlaying(t *testing.T) {
	body := "#EXTM3U\n#EXT-X-VERSION:7\nseg00000.ts\n"
	since := time.Date(2026, 8, 17, 12, 0, 0, 0, time.UTC)

	out := InjectNowPlaying(body, "Song Title", "Some Artist", "trk-1", since, 210000)

	if !strings.Contains(out, `X-TITLE="Song Title"`) {
		t.Errorf("expected X-TITLE attribute, got: %s", out)
	}
	if !strings.Contains(out, `X-ARTIST="Some Artist"`) {
		t.Errorf("expected X-ARTIST attribute, got: %s", out)
	}
	if !strings.Contains(out, `START-DATE="2026-08-17T12:00:00Z"`) {
		t.Errorf("expected START-DATE attribute, got: %s", out)
	}
	if !strings.Contains(out, "DURATION=210.000") {
		t.Errorf("expected DURATION attribute, got: %s", out)
	}
	if !strings.HasPrefix(out, "#EXTM3U\n#EXT-X-DATERANGE:") {
		t.Errorf("expected DATERANGE tag right after #EXTM3U, got: %s", out)
	}
}

func TestInjectNowPlayingIdle(t *testing.T) {
	body := "#EXTM3U\nseg00000.ts\n"
	if out := InjectNowPlaying(body, "", "", "", time.Time{}, 0); out != body {
		t.Errorf("expected unchanged body when idle, got: %s", out)
	}
}

func TestInjectNowPlayingEscapesQuotes(t *testing.T) {
	body := "#EXTM3U\n"
	out := InjectNowPlaying(body, `Weird "Title"`, "Artist", "trk-1", time.Now(), 0)
	if strings.Count(out, `X-TITLE="Weird \"Title\""`) != 1 {
		t.Errorf("expected escaped quotes in title attribute, got: %s", out)
	}
}

func TestInjectServerControl(t *testing.T) {
	body := "#EXTM3U\nseg00000.ts\n"
	out := InjectServerControl(body)
	if !strings.Contains(out, "#EXT-X-SERVER-CONTROL:CAN-BLOCK-RELOAD=YES") {
		t.Errorf("expected server-control tag, got: %s", out)
	}
	// Idempotent: calling twice shouldn't duplicate the tag.
	out2 := InjectServerControl(out)
	if strings.Count(out2, "#EXT-X-SERVER-CONTROL") != 1 {
		t.Errorf("expected exactly one server-control tag, got: %s", out2)
	}
}
