import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicyPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/50">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-slate-100 transition-colors">
            <ArrowLeft size={20} className="text-slate-600" />
          </button>
          <span className="font-bold text-lg text-slate-800">プライバシーポリシー</span>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 pt-24 pb-16">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 sm:p-12 prose prose-slate prose-sm max-w-none">
          <h1 className="text-2xl font-extrabold text-slate-900 mb-2">プライバシーポリシー</h1>
          <p className="text-sm text-slate-500 mb-8">最終更新日: 2026年2月24日</p>

          <section className="mb-8">
            <h2 className="text-lg font-bold text-slate-800 mb-3">1. はじめに</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              StudyManager（以下「本サービス」）は、ユーザーの皆さまのプライバシーを尊重し、個人情報の保護に努めています。
              本プライバシーポリシーでは、本サービスが収集する情報、その利用目的、およびユーザーの権利について説明します。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-bold text-slate-800 mb-3">2. 収集する情報</h2>
            <p className="text-sm text-slate-600 leading-relaxed mb-3">
              本サービスでは、以下の情報を収集することがあります。
            </p>
            <h3 className="text-base font-bold text-slate-700 mb-2">2.1 アカウント情報</h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-3">
              Googleアカウントでのログイン時に、以下の情報を取得します：
            </p>
            <ul className="list-disc list-inside text-sm text-slate-600 space-y-1 mb-4">
              <li>メールアドレス</li>
              <li>表示名</li>
              <li>プロフィール画像のURL</li>
              <li>Google固有のユーザーID</li>
            </ul>
            <h3 className="text-base font-bold text-slate-700 mb-2">2.2 学習データ</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              本サービスに登録された学習目標、教材情報、タスク（学習計画）、完了記録などのデータを保存します。
              これらのデータはユーザーのサービス利用のために使用され、第三者に販売されることはありません。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-bold text-slate-800 mb-3">3. Cookieの使用</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              本サービスでは、認証状態の維持のためにHTTP Cookieを使用します。
              このCookieは7日間有効で、ログアウト時に削除されます。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-bold text-slate-800 mb-3">4. 広告について</h2>
            <p className="text-sm text-slate-600 leading-relaxed mb-3">
              本サービスでは、Google AdSense による広告配信を行う場合があります。
              Google AdSenseは、ユーザーの興味に基づいた広告を表示するためにCookieを使用することがあります。
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">
              Googleによるデータの取り扱いについては、
              <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                Google プライバシーポリシー
              </a>
              をご参照ください。
              ユーザーは
              <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                Googleの広告設定
              </a>
              から、パーソナライズド広告を無効にすることができます。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-bold text-slate-800 mb-3">5. データの保存と削除</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              ユーザーのデータは、サービスの運営に必要な期間保存されます。
              アカウントの削除を希望される場合は、ログイン後に設定メニューからアカウント削除をリクエストしてください。
              アカウント削除後、関連するすべてのデータは30日以内に完全に削除されます。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-bold text-slate-800 mb-3">6. 第三者への提供</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              本サービスは、法令に基づく場合を除き、ユーザーの個人情報を本人の同意なく第三者に提供することはありません。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-bold text-slate-800 mb-3">7. お問い合わせ</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              本プライバシーポリシーに関するお問い合わせは、アプリ内のお問い合わせフォームよりご連絡ください。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-800 mb-3">8. ポリシーの変更</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              本プライバシーポリシーは、必要に応じて変更されることがあります。
              重要な変更がある場合は、本サービス上で通知します。
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
