import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/50">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-slate-100 transition-colors">
            <ArrowLeft size={20} className="text-slate-600" />
          </button>
          <span className="font-bold text-lg text-slate-800">利用規約</span>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 pt-24 pb-16">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 sm:p-12 prose prose-slate prose-sm max-w-none">
          <h1 className="text-2xl font-extrabold text-slate-900 mb-2">利用規約</h1>
          <p className="text-sm text-slate-500 mb-8">最終更新日: 2026年2月24日</p>

          <section className="mb-8">
            <h2 className="text-lg font-bold text-slate-800 mb-3">第1条（サービスの定義）</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              StudyManager（以下「本サービス」）は、学習計画の作成・管理、教材の進捗管理、学習記録の可視化を提供するWebアプリケーションです。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-bold text-slate-800 mb-3">第2条（利用条件）</h2>
            <ul className="list-disc list-inside text-sm text-slate-600 space-y-2">
              <li>本サービスを利用するには、Googleアカウントでのログインが必要です。</li>
              <li>ユーザーは、本規約およびプライバシーポリシーに同意の上、本サービスを利用するものとします。</li>
              <li>未成年の方が利用する場合は、保護者の同意を得た上でご利用ください。</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-bold text-slate-800 mb-3">第3条（アカウント）</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              ユーザーは、自身のアカウント情報を最新かつ正確に保つ責任を負います。
              アカウントの不正利用があった場合は、速やかに運営者に報告してください。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-bold text-slate-800 mb-3">第4条（料金プラン）</h2>
            <ul className="list-disc list-inside text-sm text-slate-600 space-y-2">
              <li>本サービスはFreeプラン（無料・機能制限あり）とProプラン（有料）を提供します。</li>
              <li>Proプランの料金は、サービス上に表示される金額に従います。</li>
              <li>決済後の返金は、法令に基づく場合を除き、原則として行いません。</li>
              <li>プランの内容および料金は、事前に通知の上、変更されることがあります。</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-bold text-slate-800 mb-3">第5条（禁止事項）</h2>
            <p className="text-sm text-slate-600 leading-relaxed mb-3">
              本サービスの利用にあたり、以下の行為を禁止します。
            </p>
            <ul className="list-disc list-inside text-sm text-slate-600 space-y-2">
              <li>サービスの運営を妨害する行為</li>
              <li>不正アクセスまたはそれを試みる行為</li>
              <li>他のユーザーのデータへの不正なアクセス</li>
              <li>本サービスのリバースエンジニアリング</li>
              <li>法令または公序良俗に反する行為</li>
              <li>その他、運営者が不適切と判断する行為</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-bold text-slate-800 mb-3">第6条（免責事項）</h2>
            <ul className="list-disc list-inside text-sm text-slate-600 space-y-2">
              <li>本サービスは「現状のまま」提供されます。特定目的への適合性の保証は行いません。</li>
              <li>サービスの中断、データの喪失、その他の損害について、運営者は法令で認められる範囲で責任を排除します。</li>
              <li>ただし、運営者の故意または重大な過失に起因するものについてはこの限りではありません。</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-bold text-slate-800 mb-3">第7条（サービスの変更・終了）</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              運営者は、事前に通知の上、本サービスの内容の変更または提供の終了をすることができます。
              サービス終了時は、少なくとも30日前に通知します。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-bold text-slate-800 mb-3">第8条（規約の変更）</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              本規約は、必要に応じて変更されることがあります。
              重大な変更がある場合は、本サービス上で通知します。
              変更後もサービスを継続して利用することで、変更後の規約に同意したものとみなされます。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-800 mb-3">第9条（準拠法・管轄裁判所）</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              本規約は日本法に準拠し、本サービスに関する紛争については、東京地方裁判所を第一審の専属的合意管轄裁判所とします。
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
