class Tambo < Formula
  desc "Tambo command-line tool"
  homepage "https://tambo.co"
  url "https://registry.npmjs.org/tambo/-/tambo-0.49.0.tgz"
  sha256 "1bcdc718f0fc2af145e172305c6cfb89c272abc3121fa0b635ca4cd031ff2865"
  license "MIT"

  depends_on "node"

  def install
    system "npm", "install", *std_npm_args(prefix: false)
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/tambo --version")
    system "#{bin}/tambo", "--help"
  end
end
