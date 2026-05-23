$ports = 9099, 5002, 4000, 5001, 9299, 9001, 8080, 9199, 5000, 8085
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