rm -rf build

rm function.zip

mkdir build

rsync -av --progress . ./build --exclude node_modules --exclude build

cd build

NODE_ENV=production npm install --only=production

zip -r ../function.zip .

cd ..

rm -rf build

echo "Deployment success"
