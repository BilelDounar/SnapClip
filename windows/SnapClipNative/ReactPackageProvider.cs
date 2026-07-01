using Microsoft.ReactNative;
using Microsoft.ReactNative.Managed;

namespace SnapClipNative
{
    public sealed partial class ReactPackageProvider : IReactPackageProvider
    {
        public void CreatePackage(IReactPackageBuilder packageBuilder)
        {
            CreatePackageImplementation(packageBuilder);
        }

        partial void CreatePackageImplementation(IReactPackageBuilder packageBuilder);
    }
}
