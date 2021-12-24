all: ddsbase.cpp pvm2raw.cpp
	g++ -c ddsbase.cpp
	g++ pvm2raw.cpp ddsbase.o -o main
clean:
	rm *.o