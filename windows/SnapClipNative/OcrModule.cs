using Microsoft.ReactNative;
using Microsoft.ReactNative.Managed;
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Threading.Tasks;
using Windows.Graphics.Imaging;
using Windows.Media.Ocr;

namespace SnapClipNative
{
    [ReactModule]
    internal sealed class OcrModule
    {
        [ReactMethod("captureWindowText")]
        public async void CaptureWindowText(int hwndInt, IReactPromise<string> promise)
        {
            try
            {
                var hwnd = new IntPtr(hwndInt);
                var result = await CaptureAndRecognizeAsync(hwnd);
                promise.Resolve(result);
            }
            catch (Exception ex)
            {
                promise.Reject(new ReactError { Exception = ex });
            }
        }

        private static async Task<string> CaptureAndRecognizeAsync(IntPtr hwnd)
        {
            var ocrEngine = OcrEngine.TryCreateFromUserProfileLanguages();
            if (ocrEngine == null)
            {
                throw new InvalidOperationException("OCR engine not available.");
            }

            using (var bitmap = await WindowCapture.CaptureAsync(hwnd))
            {
                if (bitmap == null)
                {
                    throw new InvalidOperationException("Failed to capture window.");
                }

                var result = await ocrEngine.RecognizeAsync(bitmap);
                return OcrResultSerializer.ToJson(result);
            }
        }
    }
}
