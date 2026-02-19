
Add-Type -AssemblyName System.Drawing

function Optimize-Image {
    param (
        [string]$ImagePath,
        [string]$OutputPath,
        [int]$MaxWidth,
        [int]$MaxHeight
    )

    if (-not (Test-Path $ImagePath)) {
        Write-Host "Image not found: $ImagePath" -ForegroundColor Red
        return
    }

    try {
        $img = [System.Drawing.Image]::FromFile($ImagePath)
        
        # Calculate new dimensions
        $width = $img.Width
        $height = $img.Height
        $ratio = 1.0

        if ($width -gt $MaxWidth -or $height -gt $MaxHeight) {
            $ratioX = $MaxWidth / $width
            $ratioY = $MaxHeight / $height
            $ratio = [Math]::Min($ratioX, $ratioY)
            $width = [int]($width * $ratio)
            $height = [int]($height * $ratio)
        }

        # Create new bitmap with new dimensions
        $newImg = new-object System.Drawing.Bitmap($width, $height)
        $graph = [System.Drawing.Graphics]::FromImage($newImg)
        
        # High quality settings
        $graph.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
        $graph.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graph.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        
        # Draw resized image
        $graph.DrawImage($img, 0, 0, $width, $height)
        
        # Determine encoder parameters for quality? 
        # PNG is lossless, but resizing reduces pixel count significantly.
        # System.Drawing saves PNG with default compression. usually ok.
        
        $newImg.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
        
        $graph.Dispose()
        $newImg.Dispose()
        $img.Dispose()
        
        Write-Host "Optimized $ImagePath -> $OutputPath ($width x $height)" -ForegroundColor Green
    }
    catch {
        Write-Host "Error processing $ImagePath : $_" -ForegroundColor Red
    }
}

$dir = "g:\2048\2048undo\2048 (1.51)\2048(1.61)\2048\images\horse"
# Optimization targets (English names):
# horse_center_temp.png (Center): Max 1024x1024
Optimize-Image -ImagePath "$dir\horse_center_temp.png" -OutputPath "$dir\horse_center_opt.png" -MaxWidth 1024 -MaxHeight 1024

# horse_head_temp.png (Top Right): Max 512x512
Optimize-Image -ImagePath "$dir\horse_head_temp.png" -OutputPath "$dir\horse_head_opt.png" -MaxWidth 512 -MaxHeight 512

# horse_war_temp.png (Bottom Left): Max 800x800
Optimize-Image -ImagePath "$dir\horse_war_temp.png" -OutputPath "$dir\horse_war_opt.png" -MaxWidth 800 -MaxHeight 800
