---
name: cpp
description: C/C++ Development. Systems programming, performance optimization, memory management. Route to here when the user mentions C, C++, CMake, memory, or pointers.
---

# 📜 Talisman Grimoire · C/C++


## Modern C++ (C++17/20)

### Smart Pointers
```cpp
#include <memory>

// unique_ptr - Exclusive ownership
auto ptr = std::make_unique<MyClass>(args);
ptr->method();

// shared_ptr - Shared ownership
auto shared = std::make_shared<MyClass>(args);
auto copy = shared;  // Reference count +1

// weak_ptr - Weak reference, doesn't increase reference count
std::weak_ptr<MyClass> weak = shared;
if (auto locked = weak.lock()) {
    locked->method();
}
```

### Containers and Algorithms
```cpp
#include <vector>
#include <algorithm>
#include <ranges>

std::vector<int> nums = {1, 2, 3, 4, 5};

// Range-based for
for (const auto& n : nums) {
    std::cout << n << std::endl;
}

// Algorithms
auto it = std::find(nums.begin(), nums.end(), 3);
std::sort(nums.begin(), nums.end());

// C++20 Ranges
auto even = nums | std::views::filter([](int n) { return n % 2 == 0; });
auto squared = nums | std::views::transform([](int n) { return n * n; });
```

### Lambda Expressions
```cpp
// Basic lambda
auto add = [](int a, int b) { return a + b; };

// Captures
int x = 10;
auto capture_val = [x]() { return x; };      // Capture by value
auto capture_ref = [&x]() { return x; };     // Capture by reference
auto capture_all = [=]() { return x; };      // Capture all by value
auto capture_all_ref = [&]() { return x; };  // Capture all by reference

// Generic lambda (C++14)
auto generic = [](auto a, auto b) { return a + b; };
```

### Concurrent Programming
```cpp
#include <thread>
#include <mutex>
#include <future>

// Threads
std::thread t([]() {
    std::cout << "Hello from thread" << std::endl;
});
t.join();

// Mutex
std::mutex mtx;
{
    std::lock_guard<std::mutex> lock(mtx);
    // Critical section
}

// async/future
auto future = std::async(std::launch::async, []() {
    return compute_result();
});
auto result = future.get();

// Condition Variable
std::condition_variable cv;
std::unique_lock<std::mutex> lock(mtx);
cv.wait(lock, []() { return ready; });
```

## Memory Management

### RAII Pattern
```cpp
class FileHandle {
public:
    FileHandle(const char* path) : file(fopen(path, "r")) {
        if (!file) throw std::runtime_error("Failed to open file");
    }

    ~FileHandle() {
        if (file) fclose(file);
    }

    // Disable copy
    FileHandle(const FileHandle&) = delete;
    FileHandle& operator=(const FileHandle&) = delete;

    // Allow move
    FileHandle(FileHandle&& other) noexcept : file(other.file) {
        other.file = nullptr;
    }

private:
    FILE* file;
};
```

### Memory Safety Checks
```bash
# AddressSanitizer
g++ -fsanitize=address -g main.cpp -o main
./main

# Valgrind
valgrind --leak-check=full ./main

# Static Analysis
clang-tidy main.cpp
cppcheck main.cpp
```

## CMake

### CMakeLists.txt
```cmake
cmake_minimum_required(VERSION 3.16)
project(MyProject VERSION 1.0.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Add Executable
add_executable(myapp
    src/main.cpp
    src/utils.cpp
)

# Add Library
add_library(mylib STATIC
    src/lib.cpp
)

# Link Library
target_link_libraries(myapp PRIVATE mylib)

# Include Directories
target_include_directories(myapp PRIVATE ${CMAKE_SOURCE_DIR}/include)

# Find External Package
find_package(Threads REQUIRED)
target_link_libraries(myapp PRIVATE Threads::Threads)

# Testing
enable_testing()
add_executable(tests tests/test_main.cpp)
add_test(NAME MyTests COMMAND tests)
```

### Build
```bash
mkdir build && cd build
cmake ..
cmake --build .
ctest  # Run tests
```

## Testing

### Google Test
```cpp
#include <gtest/gtest.h>

TEST(MathTest, Add) {
    EXPECT_EQ(add(1, 2), 3);
    EXPECT_EQ(add(-1, 1), 0);
}

TEST(MathTest, Divide) {
    EXPECT_DOUBLE_EQ(divide(10, 2), 5.0);
    EXPECT_THROW(divide(1, 0), std::invalid_argument);
}

// Fixture
class UserTest : public ::testing::Test {
protected:
    void SetUp() override {
        user = std::make_unique<User>("Alice");
    }

    std::unique_ptr<User> user;
};

TEST_F(UserTest, GetName) {
    EXPECT_EQ(user->getName(), "Alice");
}
```

## Project Structure

```
myproject/
├── CMakeLists.txt
├── include/
│   └── myproject/
│       ├── utils.h
│       └── types.h
├── src/
│   ├── main.cpp
│   └── utils.cpp
├── tests/
│   └── test_main.cpp
└── build/
```

## Common Libraries

| Library | Purpose |
|---|------|
| Boost | General-purpose library collection |
| fmt | Formatted output |
| spdlog | Logging |
| nlohmann/json | JSON |
| Catch2/GTest | Testing |
| OpenSSL | Cryptography |

---