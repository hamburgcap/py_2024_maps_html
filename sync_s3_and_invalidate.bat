@echo off
echo ============================
echo STARTING S3 SYNC PROCESS...
echo ============================
echo.

:: Run S3 sync and store output in a temp file
aws s3 sync "G:/My Drive/Github/py_2024_maps_html/" s3://rota-arremate-static/ --delete --exclude "sync_s3_and_invalidate.bat" --exclude "sync_log.txt" --exclude "sync_output.txt" --exclude "locations.json" --exclude "locations_resultados.json"> sync_output.txt 2>&1

:: Check if there were changes (file is not empty)
for %%A in (sync_output.txt) do if %%~zA NEQ 0 (
    echo.
    echo ============================
    echo CHANGES DETECTED! INVALIDATING CLOUDFRONT CACHE...
    echo ============================
    echo.

    aws cloudfront create-invalidation --distribution-id EMXNE5BT9PKFF --paths "/*"

    echo.
    echo ============================
    echo CLOUDFRONT INVALIDATION TRIGGERED!
    echo CHECK STATUS IN AWS CONSOLE.
    echo ============================
) else (
    echo.
    echo ============================
    echo NO CHANGES DETECTED! SKIPPING INVALIDATION.
    echo ============================
)

echo.
echo ALL TASKS COMPLETED SUCCESSFULLY!
pause
