using System;
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
                int left = int.MaxValue, top = int.MaxValue, right = int.MinValue, bottom = int.MinValue;
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
                    left = Math.Min(left, (int)word.BoundingRect.Left);
                    top = Math.Min(top, (int)word.BoundingRect.Top);
                    right = Math.Max(right, (int)(word.BoundingRect.Left + word.BoundingRect.Width));
                    bottom = Math.Max(bottom, (int)(word.BoundingRect.Top + word.BoundingRect.Height));
                }

                blocks.Add(new Dictionary<string, object>
                {
                    { "text", line.Text },
                    { "x", left == int.MaxValue ? 0 : left },
                    { "y", top == int.MaxValue ? 0 : top },
                    { "width", left == int.MaxValue ? 0 : right - left },
                    { "height", top == int.MaxValue ? 0 : bottom - top },
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
