import requests
import sys
import json
from datetime import datetime

class CrackAGagAPITester:
    def __init__(self, base_url="https://d9b8653d-5d51-49fb-9c32-01a41dcad143.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.user = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            
            if success:
                self.log_test(name, True)
                try:
                    return True, response.json()
                except:
                    return True, response.text
            else:
                self.log_test(name, False, f"Expected {expected_status}, got {response.status_code}. Response: {response.text[:200]}")
                return False, {}

        except Exception as e:
            self.log_test(name, False, f"Request failed: {str(e)}")
            return False, {}

    def test_login(self):
        """Test login with existing user"""
        print("\n🔐 Testing Authentication...")
        success, response = self.run_test(
            "Login with existing user",
            "POST",
            "auth/login",
            200,
            data={"email": "techguy@example.com", "password": "password123"}
        )
        
        if success and isinstance(response, dict) and 'token' in response:
            self.token = response['token']
            self.user = response.get('user', {})
            print(f"   Logged in as: {self.user.get('username', 'Unknown')}")
            return True
        return False

    def test_register(self):
        """Test user registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        test_user = {
            "username": f"testuser_{timestamp}",
            "email": f"test_{timestamp}@example.com",
            "password": "TestPass123!"
        }
        
        success, response = self.run_test(
            "Register new user",
            "POST",
            "auth/register",
            201,
            data=test_user
        )
        return success

    def test_get_posts(self):
        """Test getting posts"""
        print("\n📝 Testing Posts API...")
        
        # Test getting jokes
        success1, _ = self.run_test(
            "Get jokes",
            "GET",
            "posts?type=joke",
            200
        )
        
        # Test getting clips
        success2, _ = self.run_test(
            "Get clips",
            "GET",
            "posts?type=clip",
            200
        )
        
        # Test with interest filter
        success3, _ = self.run_test(
            "Get posts with interest filter",
            "GET",
            "posts?type=joke&interest=Programming",
            200
        )
        
        # Test with sorting
        success4, _ = self.run_test(
            "Get posts sorted by top",
            "GET",
            "posts?type=joke&sort=top",
            200
        )
        
        return success1 and success2 and success3 and success4

    def test_create_post(self):
        """Test creating a new post"""
        if not self.token:
            self.log_test("Create post (no auth)", False, "No authentication token")
            return False
        
        test_post = {
            "type": "joke",
            "title": "Test Joke from API",
            "content": "Why do programmers prefer dark mode? Because light attracts bugs!",
            "interest": "Programming",
            "tags": "programming,test"
        }
        
        success, response = self.run_test(
            "Create new post",
            "POST",
            "posts",
            201,
            data=test_post
        )
        
        if success and isinstance(response, dict) and 'id' in response:
            self.created_post_id = response['id']
            return True
        return False

    def test_vote_on_post(self):
        """Test voting functionality"""
        if not self.token:
            self.log_test("Vote on post (no auth)", False, "No authentication token")
            return False
        
        if not hasattr(self, 'created_post_id'):
            self.log_test("Vote on post (no post)", False, "No post ID available")
            return False
        
        # Test upvote
        success1, _ = self.run_test(
            "Upvote post",
            "POST",
            f"posts/{self.created_post_id}/vote",
            200,
            data={"voteType": "up"}
        )
        
        # Test downvote (should change from up to down)
        success2, _ = self.run_test(
            "Downvote post",
            "POST",
            f"posts/{self.created_post_id}/vote",
            200,
            data={"voteType": "down"}
        )
        
        # Test removing vote (toggle off)
        success3, _ = self.run_test(
            "Remove vote",
            "POST",
            f"posts/{self.created_post_id}/vote",
            200,
            data={"voteType": "down"}
        )
        
        return success1 and success2 and success3

    def test_invalid_requests(self):
        """Test error handling"""
        print("\n🚫 Testing Error Handling...")
        
        # Test login with invalid credentials
        success1, _ = self.run_test(
            "Login with invalid credentials",
            "POST",
            "auth/login",
            401,
            data={"email": "invalid@example.com", "password": "wrongpass"}
        )
        
        # Test creating post without auth
        old_token = self.token
        self.token = None
        success2, _ = self.run_test(
            "Create post without auth",
            "POST",
            "posts",
            401,
            data={"type": "joke", "title": "Test", "interest": "Programming"}
        )
        self.token = old_token
        
        # Test voting on non-existent post
        success3, _ = self.run_test(
            "Vote on non-existent post",
            "POST",
            "posts/99999/vote",
            404,
            data={"voteType": "up"}
        )
        
        return success1 and success2 and success3

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting CRACK-A-GAG API Tests...")
        print(f"Testing against: {self.base_url}")
        
        # Test authentication
        login_success = self.test_login()
        register_success = self.test_register()
        
        # Test posts functionality
        posts_success = self.test_get_posts()
        create_success = self.test_create_post()
        vote_success = self.test_vote_on_post()
        
        # Test error handling
        error_handling_success = self.test_invalid_requests()
        
        # Print summary
        print(f"\n📊 Test Summary:")
        print(f"Tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Success rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        # Detailed results
        print(f"\n📋 Detailed Results:")
        for result in self.test_results:
            status = "✅" if result['success'] else "❌"
            print(f"{status} {result['test']}")
            if not result['success'] and result['details']:
                print(f"   └─ {result['details']}")
        
        return self.tests_passed == self.tests_run

def main():
    tester = CrackAGagAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())