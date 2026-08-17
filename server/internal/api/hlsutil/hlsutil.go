// Package hlsutil provides helpers for serving HLS playlists.
package hlsutil

import (
	"fmt"
	"strings"
	"time"
)

// InjectServerControl adds the EXT-X-SERVER-CONTROL tag required for LL-HLS
// blocking reload to a playlist body, if not already present.
func InjectServerControl(body string) string {
	const serverControl = "#EXT-X-SERVER-CONTROL:CAN-BLOCK-RELOAD=YES,PART-HOLD-BACK=0.6\n"
	if strings.Contains(body, "#EXT-X-SERVER-CONTROL") {
		return body
	}
	return strings.Replace(body, "#EXTM3U\n", "#EXTM3U\n"+serverControl, 1)
}

// InjectNowPlaying adds an EXT-X-DATERANGE tag carrying now-playing track
// metadata to a playlist body, right after #EXTM3U. Native HLS players
// without special handling for the custom X- attributes just ignore the
// tag; Kast's own web player (or any custom client) can parse it to show
// live track info without a separate polling request.
//
// Does nothing if title or since is unset (nothing currently playing).
func InjectNowPlaying(body string, title, artist, trackID string, since time.Time, durationMs int64) string {
	if title == "" || since.IsZero() {
		return body
	}
	id := fmt.Sprintf("np-%s-%d", trackID, since.Unix())
	tag := fmt.Sprintf(
		"#EXT-X-DATERANGE:ID=%q,CLASS=\"com.kast.nowplaying\",START-DATE=%q,X-TITLE=%q,X-ARTIST=%q",
		id, since.UTC().Format(time.RFC3339), title, artist,
	)
	if durationMs > 0 {
		tag += fmt.Sprintf(",DURATION=%.3f", float64(durationMs)/1000)
	}
	tag += "\n"
	return strings.Replace(body, "#EXTM3U\n", "#EXTM3U\n"+tag, 1)
}

// ParseInt parses a non-negative decimal integer from s without strconv to
// avoid allocations in the hot HLS path.
func ParseInt(s string) (int, error) {
	n := 0
	for _, ch := range s {
		if ch < '0' || ch > '9' {
			return 0, fmt.Errorf("not a number")
		}
		n = n*10 + int(ch-'0')
	}
	return n, nil
}
