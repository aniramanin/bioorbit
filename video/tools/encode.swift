// SI disclosure: written with the assistance of an AI coding assistant (Claude, Anthropic).
import AVFoundation
import CoreImage
import ImageIO

let args = CommandLine.arguments
let framesDir = args[1], wavPath = args[2], outPath = args[3]
let W = 1080, H = 1920, FPS: Int32 = 30, N = 900
let outURL = URL(fileURLWithPath: outPath)
try? FileManager.default.removeItem(at: outURL)
let writer = try! AVAssetWriter(outputURL: outURL, fileType: .mp4)

func meta(_ key: AVMetadataKey, _ space: AVMetadataKeySpace, _ v: String) -> AVMetadataItem {
    let m = AVMutableMetadataItem(); m.key = key as NSString; m.keySpace = space; m.value = v as NSString; return m
}
let disclosure = "SI-assisted production: motion graphics, code and the procedurally synthesized soundtrack were made with the assistance of an AI coding assistant (Claude, Anthropic). App screens are real captures of BioOrbit."
writer.metadata = [
    meta(.commonKeyTitle, .common, "BioOrbit — Astronaut Health OS (30 s reel)"),
    meta(.commonKeyCreator, .common, "Team ICBS · LIASTRA Institute — NASA Space Apps Challenge 2026"),
    meta(.commonKeyDescription, .common, disclosure),
    meta(.iTunesMetadataKeyUserComment, .iTunes, disclosure),
]

let vIn = AVAssetWriterInput(mediaType: .video, outputSettings: [
    AVVideoCodecKey: AVVideoCodecType.h264, AVVideoWidthKey: W, AVVideoHeightKey: H,
    AVVideoCompressionPropertiesKey: [AVVideoAverageBitRateKey: 10_000_000, AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel,
                                      AVVideoMaxKeyFrameIntervalKey: 30],
])
vIn.expectsMediaDataInRealTime = false
let adaptor = AVAssetWriterInputPixelBufferAdaptor(assetWriterInput: vIn, sourcePixelBufferAttributes: [
    kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA, kCVPixelBufferWidthKey as String: W, kCVPixelBufferHeightKey as String: H])
writer.add(vIn)

let aIn = AVAssetWriterInput(mediaType: .audio, outputSettings: [
    AVFormatIDKey: kAudioFormatMPEG4AAC, AVSampleRateKey: 44100, AVNumberOfChannelsKey: 2, AVEncoderBitRateKey: 192_000])
aIn.expectsMediaDataInRealTime = false
writer.add(aIn)

let wav = AVURLAsset(url: URL(fileURLWithPath: wavPath))
let reader = try! AVAssetReader(asset: wav)
let aTrack = wav.tracks(withMediaType: .audio)[0]
let aOut = AVAssetReaderTrackOutput(track: aTrack, outputSettings: [AVFormatIDKey: kAudioFormatLinearPCM, AVLinearPCMBitDepthKey: 16,
    AVLinearPCMIsFloatKey: false, AVLinearPCMIsBigEndianKey: false, AVLinearPCMIsNonInterleaved: false])
reader.add(aOut)

writer.startWriting(); writer.startSession(atSourceTime: .zero); reader.startReading()
let ctx = CIContext()
let cs = CGColorSpace(name: CGColorSpace.sRGB)!
var f = 0
let q = DispatchQueue(label: "v"), qa = DispatchQueue(label: "a")
let group = DispatchGroup()
group.enter(); group.enter()
vIn.requestMediaDataWhenReady(on: q) {
    while vIn.isReadyForMoreMediaData && f < N {
        let url = URL(fileURLWithPath: String(format: "%@/f%04d.jpg", framesDir, f))
        guard let src = CGImageSourceCreateWithURL(url as CFURL, nil), let img = CGImageSourceCreateImageAtIndex(src, 0, nil) else { fatalError("frame \(f)") }
        var pb: CVPixelBuffer?
        CVPixelBufferPoolCreatePixelBuffer(nil, adaptor.pixelBufferPool!, &pb)
        ctx.render(CIImage(cgImage: img), to: pb!, bounds: CGRect(x: 0, y: 0, width: W, height: H), colorSpace: cs)
        adaptor.append(pb!, withPresentationTime: CMTime(value: CMTimeValue(f), timescale: FPS))
        f += 1
    }
    if f >= N { vIn.markAsFinished(); group.leave() }
}
aIn.requestMediaDataWhenReady(on: qa) {
    while aIn.isReadyForMoreMediaData {
        if let sb = aOut.copyNextSampleBuffer() { aIn.append(sb) } else { aIn.markAsFinished(); group.leave(); return }
    }
}
group.wait()
let done = DispatchSemaphore(value: 0)
writer.finishWriting { done.signal() }
done.wait()
print(writer.status == .completed ? "ok" : "fail \(String(describing: writer.error))")
