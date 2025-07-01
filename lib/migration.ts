import { createClient } from '@/lib/supabase'
// import { authenticatedFetch } from '@/lib/api-client'

// localStorageのデータをSupabaseに移行
export async function migrateLocalDataToSupabase(userId: string) {
  const supabase = createClient()
  
  try {
    // 1. 既存のセッションIDを取得
    const sessionId = localStorage.getItem('aniccaSessionId')
    
    // 2. Slack接続状態を確認
    const isSlackConnected = localStorage.getItem('anicca_slack_connected') === 'true'
    
    if (sessionId && isSlackConnected) {
      console.log('🔄 Migrating Slack connection to user account...')
      
      // 3. プロキシサーバーに移行リクエストを送信
      const proxyUrl = process.env.NEXT_PUBLIC_PROXY_URL || 'https://anicca-proxy-production.up.railway.app'
      const response = await fetch(`${proxyUrl}/api/migrate-connection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          userId,
          service: 'slack'
        })
      })
      
      if (response.ok) {
        console.log('✅ Slack connection migrated successfully')
        // 移行成功後、localStorageをクリーンアップ
        localStorage.removeItem('anicca_slack_connected')
        localStorage.removeItem('aniccaSessionId')
      } else if (response.status === 404) {
        // 古いセッションが見つからない場合は、単にクリーンアップ
        console.log('⚠️ Old session not found, cleaning up localStorage')
        localStorage.removeItem('anicca_slack_connected')
        localStorage.removeItem('aniccaSessionId')
      } else {
        console.error('❌ Failed to migrate Slack connection')
      }
    }
    
    // 4. その他の設定も移行（言語設定など）
    const language = localStorage.getItem('anicca_language') || 'en'
    
    // ユーザー設定をSupabaseに保存
    const { error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: userId,
        language: language,
        preferences: {
          migrated_at: new Date().toISOString()
        }
      })
    
    if (error) {
      console.error('Error saving user settings:', error)
    }
    
  } catch (error) {
    console.error('Migration error:', error)
  }
}