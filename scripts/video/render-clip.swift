// Render an explanatory clip from captured UI stills. No screen access.
import AppKit
import AVFoundation
import CoreVideo
import Foundation

struct Scene: Decodable { let path: String; let seconds: Double }
let args = CommandLine.arguments
if args.count != 3 { fatalError("Usage: render-clip.swift scenes.json output.mp4") }
let scenes = try JSONDecoder().decode([Scene].self, from: Data(contentsOf: URL(fileURLWithPath: args[1])))
let images = try scenes.map { scene -> CGImage in
  let data = try Data(contentsOf: URL(fileURLWithPath: scene.path))
  return NSBitmapImageRep(data: data)!.cgImage!
}
let output = URL(fileURLWithPath: args[2])
try? FileManager.default.removeItem(at: output)
let width = 1280, height = 720, fps: Int32 = 30
let writer = try AVAssetWriter(outputURL: output, fileType: .mp4)
writer.shouldOptimizeForNetworkUse = true
let input = AVAssetWriterInput(mediaType: .video, outputSettings: [
  AVVideoCodecKey: AVVideoCodecType.h264,
  AVVideoWidthKey: width, AVVideoHeightKey: height,
  AVVideoCompressionPropertiesKey: [AVVideoAverageBitRateKey: 1800000, AVVideoMaxKeyFrameIntervalKey: 60]
])
let adapter = AVAssetWriterInputPixelBufferAdaptor(assetWriterInput: input, sourcePixelBufferAttributes: [
  kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32ARGB,
  kCVPixelBufferWidthKey as String: width, kCVPixelBufferHeightKey as String: height,
  kCVPixelBufferCGImageCompatibilityKey as String: true,
  kCVPixelBufferCGBitmapContextCompatibilityKey as String: true
])
writer.add(input)
guard writer.startWriting() else { fatalError(String(describing: writer.error)) }
writer.startSession(atSourceTime: .zero)
let totalFrames = Int(scenes.reduce(0) { $0 + $1.seconds } * Double(fps))
var frame = 0
for (index,scene) in scenes.enumerated() {
  for localFrame in 0..<Int(scene.seconds * Double(fps)) {
    while !input.isReadyForMoreMediaData { Thread.sleep(forTimeInterval: 0.002) }
    autoreleasepool {
      var buffer: CVPixelBuffer?
      CVPixelBufferPoolCreatePixelBuffer(nil, adapter.pixelBufferPool!, &buffer)
      let pixel = buffer!
      CVPixelBufferLockBaseAddress(pixel, [])
      let context = CGContext(data: CVPixelBufferGetBaseAddress(pixel), width: width, height: height,
        bitsPerComponent: 8, bytesPerRow: CVPixelBufferGetBytesPerRow(pixel),
        space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.noneSkipFirst.rawValue)!
      let rect = CGRect(x: 0, y: 0, width: width, height: height)
      // Brief dissolves connect the captured states; holds leave time to read.
      if index > 0 && localFrame < 12 {
        context.draw(images[index-1], in: rect)
        context.setAlpha(CGFloat(localFrame+1)/12)
      }
      context.draw(images[index], in: rect)
      context.setAlpha(1)
      context.setFillColor(CGColor(red: 0.016, green: 0.85, blue: 0.85, alpha: 1))
      context.fill(CGRect(x: 0, y: 0, width: Double(width) * Double(frame+1)/Double(totalFrames), height: 4))
      CVPixelBufferUnlockBaseAddress(pixel, [])
      if !adapter.append(pixel, withPresentationTime: CMTime(value: Int64(frame), timescale: fps)) {
        fatalError(String(describing: writer.error))
      }
    }
    frame += 1
  }
}
input.markAsFinished()
let done = DispatchSemaphore(value: 0)
writer.finishWriting { done.signal() }
done.wait()
guard writer.status == .completed else { fatalError(String(describing: writer.error)) }
print("Rendered \(frame) frames to \(output.path)")
