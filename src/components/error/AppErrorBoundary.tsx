import { Component, type ErrorInfo, type ReactNode } from "react";
import { Platform } from "react-native";

import { ErrorCoverScreen } from "./ErrorCoverScreen";

type Props = { children: ReactNode };
type State = { error: Error | null };

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("bcp render failure", error, info.componentStack);
  }

  private reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      const refresh =
        Platform.OS === "web" && typeof window !== "undefined"
          ? () => window.location.reload()
          : this.reset;
      return <ErrorCoverScreen onRefresh={refresh} />;
    }
    return this.props.children;
  }
}
