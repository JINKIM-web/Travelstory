import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

/** 화면 렌더 중 예외가 나도 앱 전체가 빈 화면이 되지 않도록 막는다. 라우트가 바뀌면 key 로 초기화된다. */
export default class ErrorBoundary extends Component<{ children: ReactNode }, { error?: Error }> {
  state: { error?: Error } = {}

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('화면 오류', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div role="alert" className="mx-auto max-w-lg rounded-lg bg-error-container p-8 text-center text-error">
        <p className="text-xl font-bold">화면을 불러오지 못했어요</p>
        <p className="mt-2 text-sm">{this.state.error.message}</p>
        <p className="mt-4 text-sm">저장된 데이터는 그대로 있습니다.</p>
        <Link to="/trips" className="mt-4 inline-block underline" onClick={() => this.setState({ error: undefined })}>
          내 여행 프로젝트로 돌아가기
        </Link>
      </div>
    )
  }
}
