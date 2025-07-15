$ports = 4000, 5000, 5001, 8080, 9000, 9099, 9199, 9499, 5173
$ports | ForEach-Object {
    Get-NetTCPConnection -LocalPort $_ -ErrorAction SilentlyContinue | ForEach-Object {
        try {
            Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
            Write-Host "Killed process $($_.OwningProcess) on port $($_.LocalPort)"
        }
        catch {
            Write-Host "Could not kill process on port $($_.LocalPort)"
        }
    }
}