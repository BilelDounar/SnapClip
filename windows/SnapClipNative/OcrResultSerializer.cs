using System.Collections.Generic;
using System.Text;
using System.Text.Json;
using Windows.Media.Ocr;

namespace SnapClipNative
{
    public static class OcrResultSerializer
    {
        public static string ToJson(OcrResult result)
        {
            var blocks = new List<Dictionary<string, object>>();
            foreach (var line in result.Lines)
            {
                var words = new List<Dictionary<string, object>>();
                foreach (var word in line.Words)
                {
                    words.Add(new Dictionary<string, object>
                    {
                        { "text", word.Text },
                        { "x", (int)word.BoundingRect.Left },
                        { "y", (int)word.BoundingRect.Top },
                        { "width", (int)word.BoundingRect.Width },
                        { "height", (int)word.BoundingRect.Height }
                    });
                }

                blocks.Add(new Dictionary<string, object>
                {
                    { "text", line.Text },
                    { "x", (int)line.BoundingRect.Left },
                    { "y", (int)line.BoundingRect.Top },
                    { "width", (int)line.BoundingRect.Width },
                    { "height", (int)line.BoundingRect.Height },
                    { "words", words }
                });
            }

            var root = new Dictionary<string, object>
            {
                { "text", result.Text },
                { "blocks", blocks }
            };

            return JsonSerializer.Serialize(root, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });
        }
    }
}
