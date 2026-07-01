using System;
using System.Runtime.InteropServices;
using System.Runtime.InteropServices.WindowsRuntime;
using System.Threading.Tasks;
using Windows.Graphics.Imaging;
using Windows.Storage.Streams;

namespace SnapClipNative
{
    internal static class WindowCapture
    {
        public static async Task<SoftwareBitmap?> CaptureAsync(IntPtr hwnd)
        {
            if (hwnd == IntPtr.Zero)
            {
                return null;
            }

            if (!GetWindowRect(hwnd, out var rect) || rect.Width == 0 || rect.Height == 0)
            {
                return null;
            }

            var width = rect.Width;
            var height = rect.Height;
            var hdcWindow = GetDC(hwnd);
            var hdcMem = CreateCompatibleDC(hdcWindow);
            var hBitmap = CreateCompatibleBitmap(hdcWindow, width, height);
            var hOld = SelectObject(hdcMem, hBitmap);

            PrintWindow(hwnd, hdcMem, PW_RENDERFULLCONTENT);

            SelectObject(hdcMem, hOld);
            DeleteDC(hdcMem);
            ReleaseDC(hwnd, hdcWindow);

            var bitmap = await BitmapFromHBitmapAsync(hBitmap, width, height);
            DeleteObject(hBitmap);
            return bitmap;
        }

        private static async Task<SoftwareBitmap?> BitmapFromHBitmapAsync(IntPtr hBitmap, int width, int height)
        {
            var bitmapInfo = new BITMAPINFO
            {
                bmiHeader = new BITMAPINFOHEADER
                {
                    biSize = Marshal.SizeOf(typeof(BITMAPINFOHEADER)),
                    biWidth = width,
                    biHeight = -height,
                    biPlanes = 1,
                    biBitCount = 32,
                    biCompression = BI_RGB,
                    biSizeImage = width * height * 4
                }
            };

            var buffer = new byte[width * height * 4];
            var hdc = GetDC(IntPtr.Zero);
            GetDIBits(hdc, hBitmap, 0, (uint)height, buffer, ref bitmapInfo, DIB_RGB_COLORS);
            ReleaseDC(IntPtr.Zero, hdc);

            var softwareBitmap = new SoftwareBitmap(BitmapPixelFormat.Bgra8, width, height, BitmapAlphaMode.Premultiplied);
            softwareBitmap.CopyFromBuffer(buffer.AsBuffer());

            return softwareBitmap;
        }

        private const int PW_RENDERFULLCONTENT = 0x00000002;
        private const int BI_RGB = 0;
        private const int DIB_RGB_COLORS = 0;

        [DllImport("user32.dll", SetLastError = true)]
        private static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);

        [DllImport("user32.dll")]
        private static extern IntPtr GetDC(IntPtr hWnd);

        [DllImport("user32.dll")]
        private static extern int ReleaseDC(IntPtr hWnd, IntPtr hDC);

        [DllImport("gdi32.dll")]
        private static extern IntPtr CreateCompatibleDC(IntPtr hdc);

        [DllImport("gdi32.dll")]
        private static extern bool DeleteDC(IntPtr hdc);

        [DllImport("gdi32.dll")]
        private static extern IntPtr CreateCompatibleBitmap(IntPtr hdc, int nWidth, int nHeight);

        [DllImport("gdi32.dll")]
        private static extern IntPtr SelectObject(IntPtr hdc, IntPtr hgdiobj);

        [DllImport("gdi32.dll")]
        private static extern bool DeleteObject(IntPtr hObject);

        [DllImport("user32.dll")]
        private static extern bool PrintWindow(IntPtr hwnd, IntPtr hdcBlt, uint nFlags);

        [DllImport("gdi32.dll")]
        private static extern int GetDIBits(IntPtr hdc, IntPtr hbmp, uint uStartScan, uint cScanLines, byte[] lpvBits, ref BITMAPINFO lpbi, uint uUsage);

        [StructLayout(LayoutKind.Sequential)]
        private struct RECT
        {
            public int Left;
            public int Top;
            public int Right;
            public int Bottom;

            public int Width => Right - Left;
            public int Height => Bottom - Top;
        }

        [StructLayout(LayoutKind.Sequential)]
        private struct BITMAPINFOHEADER
        {
            public int biSize;
            public int biWidth;
            public int biHeight;
            public ushort biPlanes;
            public ushort biBitCount;
            public int biCompression;
            public int biSizeImage;
            public int biXPelsPerMeter;
            public int biYPelsPerMeter;
            public int biClrUsed;
            public int biClrImportant;
        }

        [StructLayout(LayoutKind.Sequential)]
        private struct BITMAPINFO
        {
            public BITMAPINFOHEADER bmiHeader;
            public uint bmiColors;
        }
    }
}
