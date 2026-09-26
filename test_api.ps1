$body = @{ username = "admin"; password = "admin123" } | ConvertTo-Json
try {
  $login = Invoke-RestMethod -Uri 'http://localhost:8080/api/auth/login' -Method Post -ContentType 'application/json' -Body $body -ErrorAction Stop
  $token = $login.msg   # 后端把 token 放在了 msg 字段
  Write-Host "TOKEN(from msg): $($token.Substring(0,20))..."
  $headers = @{ Authorization = "Bearer $token" }
  $info = Invoke-RestMethod -Uri 'http://localhost:8080/api/auth/info' -Method Get -Headers $headers -ErrorAction Stop
  Write-Host "INFO OK code=$($info.code) username=$($info.data.username) permsCount=$($info.data.permissions.Count)"
  $menus = Invoke-RestMethod -Uri 'http://localhost:8080/api/auth/menus' -Method Get -Headers $headers -ErrorAction Stop
  Write-Host "MENUS OK code=$($menus.code) count=$($menus.data.Count)"
} catch {
  Write-Host "ERROR: $($_.Exception.Message)"
  if ($_.Exception.Response) {
    $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
    Write-Host "BODY: $($reader.ReadToEnd())"
  }
}
