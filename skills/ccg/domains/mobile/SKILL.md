---
name: mobile
description: Mobile development. iOS, Android, SwiftUI, Jetpack Compose, React Native, Flutter, cross-platform. Route here when the user mentions mobile development, iOS, Android, or cross-platform.
license: MIT
user-invocable: false
disable-model-invocation: false
---

# Mobile Development Domain · Mobile Development

## Domain Overview

```
Native Development          Cross-Platform Development
├── iOS (SwiftUI/UIKit)     ├── React Native (JS/TS)
├── Android (Compose/Kotlin)└── Flutter (Dart)
└── Common: MVVM / Network Layer / Persistence / Testing
```

---

## iOS Development

### SwiftUI Core Patterns

- View Component: `struct MyView: View { var body: some View { ... } }`
- State Management:
  - `@State` — Local state
  - `@Binding` — Parent-child two-way binding
  - `@StateObject` — Owns ObservableObject
  - `@ObservedObject` — References ObservableObject
  - `@EnvironmentObject` / `@Environment` — Global injection
- ObservableObject: `@Published` property automatically triggers UI updates
- Custom ViewModifier: `struct CardModifier: ViewModifier` + `extension View { func cardStyle() }`
- Lifecycle: `.task { await ... }` / `.onAppear` / `.onDisappear`

### UIKit Integration

- UIViewControllerRepresentable: Wrap UIViewController into SwiftUI
- UIViewRepresentable: Wrap UIView into SwiftUI
- Coordinator Pattern: Handle delegate callbacks
- Auto Layout: `NSLayoutConstraint.activate([...])` + `translatesAutoresizingMaskIntoConstraints = false`

### Combine Reactive

- Publisher: `URLSession.shared.dataTaskPublisher` → `map` → `decode` → `eraseToAnyPublisher`
- Subscription: `.sink(receiveCompletion:receiveValue:)` + `.store(in: &cancellables)`
- Common Operators: `debounce` / `removeDuplicates` / `combineLatest` / `flatMap`
- Subject: `PassthroughSubject` (No initial value) / `CurrentValueSubject` (Has initial value)

### iOS Architecture

MVVM (Recommended):
- Model: `Codable` data structure
- Repository: `protocol` + `async throws` methods
- ViewModel: `@MainActor class VM: ObservableObject` + `@Published` properties
- View: `@StateObject private var viewModel = VM()`

VIPER (Complex scenarios):
- View ←→ Presenter ←→ Interactor → Entity
- Router handles navigation

### Network Layer

- APIClient: Generic `func get<T: Decodable>(_ path:) async throws -> T`
- Token Management: `request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")`
- Error Handling: `enum APIError: Error { case invalidURL, invalidResponse, httpError(Int) }`

### Data Persistence

- UserDefaults: `@propertyWrapper struct UserDefault<T>` simplifies access
- Keychain: `SecItemAdd` / `SecItemCopyMatching` stores sensitive data
- Core Data: `NSPersistentContainer` + `NSManagedObjectContext`
- SwiftData (iOS 17+): `@Model` macro simplifies persistence

### iOS Checklist

- [ ] Prioritize SwiftUI, integrate UIKit as needed
- [ ] `@MainActor` ensures UI thread safety
- [ ] async/await replaces callbacks
- [ ] Dependency injection improves testability
- [ ] LazyVStack/LazyHStack optimize large lists
- [ ] Image caching (NSCache) reduces memory pressure
- [ ] Keychain stores sensitive data (Not UserDefaults)
- [ ] Unit tests cover ViewModel + Mock Repository

---

## Android Development

### Jetpack Compose Core Patterns

- Composable: `@Composable fun MyScreen() { ... }`
- State Management:
  - `remember { mutableStateOf(value) }` — Local state
  - `rememberSaveable` — Saves across configuration changes
  - `derivedStateOf` — Derived state avoids recomposition
- LazyColumn: `items(list, key = { it.id })` provides stable keys
- Side Effects:
  - `LaunchedEffect(key)` — Launches a coroutine
  - `DisposableEffect(key)` — Cleans up resources (onDispose)
  - `SideEffect` — Syncs state to the outside
  - `snapshotFlow { state }` — Converts state change observation to Flow
- Navigation: `NavHost` + `composable(route)` + `navController.navigate()`
- Custom Modifier: `fun Modifier.myModifier(): Modifier = composed { ... }`

### ViewModel + StateFlow

- StateFlow (Recommended LiveData alternative):
  - `MutableStateFlow(UiState())` + `.asStateFlow()`
  - `_uiState.update { it.copy(isLoading = true) }`
  - In Compose: `val uiState by viewModel.uiState.collectAsState()`
- UiState data class: Encapsulates loading / error / data

### Kotlin Coroutines & Flow

- Coroutines: `viewModelScope.launch { withContext(Dispatchers.IO) { ... } }`
- Concurrency: `coroutineScope { val a = async { ... }; val b = async { ... } }`
- Flow: `flow { emit(value) }` + `.flowOn(Dispatchers.IO)`
- StateFlow: `.stateIn(scope, SharingStarted.WhileSubscribed(5000), initial)`
- Search Debounce: `searchQuery.debounce(300).filter { it.isNotEmpty() }.flatMapLatest { ... }`
- Channel: `Channel<Event>(BUFFERED)` + `.receiveAsFlow()` one-time events

### Dependency Injection (Hilt)

- `@HiltAndroidApp` Application + `@AndroidEntryPoint` Activity
- `@Module @InstallIn(SingletonComponent::class)` provides dependencies
- `@Provides @Singleton` provides instances / `@Binds` binds interfaces
- ViewModel: `@HiltViewModel class VM @Inject constructor(repo)` + `hiltViewModel()`

### Room Database

- Entity: `@Entity(tableName)` + `@PrimaryKey` + `@ColumnInfo`
- DAO: `@Query` / `@Insert(onConflict = REPLACE)` / `@Delete` + returns `Flow<List<T>>`
- Database: `@Database(entities, version)` + `Room.databaseBuilder`

### Network Layer (Retrofit)

- ApiService: `@GET` / `@POST` / `@Path` / `@Query` / `@Body` / `@Multipart`
- Interceptor: AuthInterceptor injects Bearer Token
- OkHttpClient: `addInterceptor` + `connectTimeout`

### Android Checklist

- [ ] Prioritize Compose, use View system as needed
- [ ] StateFlow replaces LiveData
- [ ] Hilt dependency injection
- [ ] Room local persistence
- [ ] `key` parameter optimizes LazyColumn
- [ ] `remember` / `derivedStateOf` avoid excessive recomposition
- [ ] Coil image loading + caching strategies
- [ ] Unit tests cover ViewModel (runTest + advanceUntilIdle)

---

## Cross-Platform Development

### React Native vs Flutter

| Dimension | React Native | Flutter |
|-----------|--------------|---------|
| Language | TypeScript | Dart |
| Rendering | Native Components (Bridged) | Custom Engine (Skia) |
| Performance | Near Native | Near Native |
| Hot Reload | Fast Refresh | Hot Reload |
| Ecosystem | npm (Mature) | pub.dev (Fast-growing) |
| UI Consistency | Follows System | Completely Consistent |
| Bundle Size | ~7MB | ~15MB |

### React Native Core Patterns

- Components: Function Components + Hooks (useState / useEffect / useCallback / useMemo)
- Lists: `FlatList` + `keyExtractor` + `initialNumToRender` + `windowSize`
- Navigation: `@react-navigation/native` + `createNativeStackNavigator`
- State Management: Redux Toolkit (`createSlice` + `createAsyncThunk`) / Zustand
- Native Bridge: `NativeModules` calls iOS(Swift) / Android(Kotlin) native code
- Performance: `React.memo` / Hermes engine / New Architecture JSI (No bridge serialization)

### Flutter Core Patterns

- Widget: StatelessWidget / StatefulWidget + `setState`
- State Management:
  - Provider: `ChangeNotifier` + `Consumer` / `context.watch`
  - Riverpod (Recommended): `FutureProvider` / `StateNotifierProvider` + `ref.watch`
- Navigation: go_router (`GoRoute` + `context.go/push/pop`)
- Native Bridge: `MethodChannel` + Platform Channels (iOS Swift / Android Kotlin)
- Performance: `const` constructors / `ListView.builder` / `RepaintBoundary` / `ValueKey`

### Selection Advice

| Scenario | Recommendation | Reason |
|----------|----------------|--------|
| Team has Web background | React Native | Low learning curve |
| Pursuing extreme performance/animations | Flutter | Custom engine 60fps |
| Highly customized UI | Flutter | Full rendering control |
| Heavy native interactions | React Native | Mature bridging ecosystem |
| Native extreme experience needed | Native Development | No bridge overhead |

### Cross-Platform Checklist

- [ ] Tech stack matches team and business requirements
- [ ] List optimization: FlatList(RN) / ListView.builder(Flutter) + key
- [ ] State management: Redux Toolkit(RN) / Riverpod(Flutter)
- [ ] Validate native module bridging solutions
- [ ] Bundle size optimization: ProGuard(Android) / tree-shake-icons(Flutter)
- [ ] Performance baselines: Cold start < 1.5s / Rendering > 55fps

---

## General Best Practices

| Practice | Description |
|----------|-------------|
| MVVM Architecture | Separate UI / Business Logic / Data Layer |
| Dependency Injection | Hilt(Android) / Protocol(iOS) / Context(RN) |
| Reactive State | StateFlow / Combine / Hooks / Riverpod |
| Network Encapsulation | Unified error handling + Token management + Retries |
| Local Persistence | Room / Core Data / AsyncStorage / Hive |
| List Optimization | Lazy loading + Stable keys + Caching |
| Test Coverage | ViewModel unit tests + UI tests for critical flows |

## Trigger Words

iOS, SwiftUI, UIKit, Combine, Android, Jetpack Compose, Kotlin, React Native, Flutter, Cross-Platform, Mobile Development, MVVM
